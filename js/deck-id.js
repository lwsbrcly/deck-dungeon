/*
 * Deck ID / deterministic randomness
 *
 * A Deck ID is simply a 64-bit random seed.
 *
 * The seed is used by the game's deterministic PRNG, which feeds the same
 * Fisher-Yates shuffle used for the deck. Therefore:
 *
 *   Deck ID -> seed -> PRNG -> shuffle -> starting deck
 *
 * The ID is deliberately independent of themes and card artwork.
 *
 * This file does not yet change game startup. It provides the seed, encoder,
 * decoder and deterministic shuffle that game.js can use when wired in.
 */

var DECK_ID_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function generateDeckId() {
  var bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);

  var seed = 0n;
  for (var i = 0; i < bytes.length; i++) {
    seed = (seed << 8n) | BigInt(bytes[i]);
  }

  return encodeDeckIdSeed(seed);
}

function encodeDeckIdSeed(seed) {
  seed = BigInt(seed);

  if (seed < 0n || seed > 0xffffffffffffffffn) {
    throw new Error('Deck ID seed must be a 64-bit unsigned integer.');
  }

  // 64 bits require 11 base64url characters (the final character has only
  // two meaningful bits).
  var output = '';
  for (var i = 0; i < 11; i++) {
    var shift = BigInt((10 - i) * 6);
    output += DECK_ID_ALPHABET[Number((seed >> shift) & 63n)];
  }

  return output;
}

function decodeDeckId(deckId) {
  if (typeof deckId !== 'string' || deckId.length !== 11) {
    throw new Error('Deck ID must be 11 characters.');
  }

  var seed = 0n;

  for (var i = 0; i < deckId.length; i++) {
    var value = DECK_ID_ALPHABET.indexOf(deckId[i]);

    if (value < 0) {
      throw new Error('Invalid Deck ID character.');
    }

    seed = (seed << 6n) | BigInt(value);
  }

  // The first 2 bits of the 66-bit base64 representation are padding and
  // must be zero. This also rejects IDs that cannot represent a 64-bit seed.
  if (seed > 0xffffffffffffffffn) {
    throw new Error('Invalid Deck ID.');
  }

  return seed;
}

/*
 * xorshift64* PRNG.
 *
 * The exact algorithm is part of the game's deterministic rules. Given the
 * same seed, it produces exactly the same sequence of values.
 */
function createSeededRandom(seed) {
  var state = BigInt(seed) & 0xffffffffffffffffn;

  // xorshift64* cannot operate from zero.
  if (state === 0n) state = 0x9e3779b97f4a7c15n;

  return function() {
    state ^= state >> 12n;
    state ^= (state << 25n) & 0xffffffffffffffffn;
    state ^= state >> 27n;
    state &= 0xffffffffffffffffn;

    var result = (state * 0x2545f4914f6cdd1dn) & 0xffffffffffffffffn;

    // Return a Number in [0, 1), using the upper 53 bits so Fisher-Yates can
    // use it exactly as it currently uses Math.random().
    return Number(result >> 11n) / 9007199254740992;
  };
}

async function seedFromDeck(deck) {
  if (!Array.isArray(deck)) {
    throw new Error('Deck seed requires a deck array.');
  }

  // The actual card IDs and their current order are the complete state we
  // need. Theme names/artwork are deliberately excluded.
  var canonical = deck.map(function(card) {
    return typeof card === 'string' ? card : card.id;
  }).join('|');

  var bytes = new TextEncoder().encode(canonical);
  var digest = await crypto.subtle.digest('SHA-256', bytes);
  var hash = new Uint8Array(digest);

  // Use the first 64 bits of SHA-256 as the deterministic shuffle seed.
  var seed = 0n;
  for (var i = 0; i < 8; i++) {
    seed = (seed << 8n) | BigInt(hash[i]);
  }

  return seed;
}

/*
 * Insert a small set of cards into an existing deck without changing the
 * relative order of any cards already in that deck.
 *
 * The supplied seed determines both the order of the inserted cards and
 * their insertion positions. The existing deck itself is never shuffled.
 */
function insertSeeded(array, cards, seed) {
  var random = createSeededRandom(seed);
  var inserted = cards.slice();

  // Randomise only the four fled cards themselves.
  for (var i = inserted.length - 1; i > 0; i--) {
    var j = Math.floor(random() * (i + 1));
    var temp = inserted[i];
    inserted[i] = inserted[j];
    inserted[j] = temp;
  }

  // Insert each fled card at a deterministic position. Because we only splice
  // into the existing array, all original cards retain their relative order.
  for (var k = 0; k < inserted.length; k++) {
    var position = Math.floor(random() * (array.length + 1));
    array.splice(position, 0, inserted[k]);
  }

  return array;
}

function shuffleSeeded(array, seed) {
  var random = createSeededRandom(seed);

  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }

  return array;
}

/*
 * Log presentation layer.
 *
 * The live log stays deliberately plain and compact: room-action ordinals are
 * rendered as 1-1, 1-2, 1-3, 2-FLEE, etc. This is important because the
 * visible log is reverse chronological and only shows its four most recent
 * entries.
 *
 * The complete copied log is chronological, so copyLogText() makes a second,
 * presentation-only pass and replaces the hyphen with box-drawing connectors:
 *   first event  -> ┬
 *   middle event -> ├
 *   final event  -> └
 *
 * Nothing in the stored game state contains the box characters. Undo therefore
 * restores the ordinary log history exactly as it always has.
 */
window.addEventListener('load', function() {
  if (typeof window.log !== 'function') return;

  var originalLog = window.log;

  // Keep the card UI's suit symbols, but use unambiguous ASCII suit codes in
  // the compact game log. This makes the log readable at small font sizes and
  // when colour is unavailable.
  window.logCard = function(card) {
    if (!card) return '--';
    var suitCodes = { spades: 'S', clubs: 'C', diamonds: 'D', hearts: 'H' };
    return String(card.rank || card.value) + (suitCodes[card.suit] || '');
  };

  function isCardAction(text, eventType, recordEvent) {
    if (recordEvent === false) return false;
    if (eventType === 'weapon' || eventType === 'monster' ||
        eventType === 'fist' || eventType === 'potion') return true;

    // Discards currently do not pass an eventType.
    return /^(?:P1|P2|COOP) .* D$/.test(String(text));
  }

  function getCurrentRoom() {
    var cleared = Number(state && state.roomsCleared) || 0;
    var target = Number(state && state.targetRooms) || 0;

    // The final room is allowed a fourth card action. Removing its last card
    // can increment roomsCleared to 14 before log() runs, but that action still
    // belongs to room 14 rather than creating a nonexistent room 15.
    if (target > 0 && cleared >= target) return target;

    // removeSelected() can clear a room and increment roomsCleared before the
    // action is logged. _roomWasDealt marks that exact transition, so the
    // action belongs to the room just completed, not the newly dealt room.
    if (state && state._roomWasDealt) return cleared;

    return cleared + 1;
  }

  function countRoomActions(room) {
    var count = 0;
    var history = state && Array.isArray(state.logHistory) ? state.logHistory : [];
    var prefix = new RegExp('^' + room + '-[1-4] ');

    for (var i = 0; i < history.length; i++) {
      if (prefix.test(String(history[i]))) count++;
    }

    return count;
  }

  function liveOrdinal(text, eventType, recordEvent) {
    var room = getCurrentRoom();

    if (eventType === 'flee' || String(text) === 'FLEE') {
      return room + '-FLEE';
    }

    if (!isCardAction(text, eventType, recordEvent)) return String(text);

    return room + '-' + (countRoomActions(room) + 1) + ' ' + String(text);
  }

  window.log = function(text, recordEvent, eventType, weaponStrengths) {
    return originalLog.call(this, liveOrdinal(text, eventType, recordEvent), recordEvent, eventType, weaponStrengths);
  };

  function boxifyCopiedLog(line, index, lines) {
    var fleeMatch = String(line).match(/^(\d+)-FLEE$/);
    var actionMatch = String(line).match(/^(\d+)-([1-4]) (.*)$/);

    if (!fleeMatch && !actionMatch) return String(line);

    var room = fleeMatch ? fleeMatch[1] : actionMatch[1];

    // Find the complete contiguous group of events belonging to this room.
    var start = index;
    while (start > 0) {
      var previous = String(lines[start - 1]).match(/^(\d+)-(FLEE|[1-4])(?: |$)/);
      if (!previous || previous[1] !== room) break;
      start--;
    }

    var end = index;
    while (end + 1 < lines.length) {
      var next = String(lines[end + 1]).match(/^(\d+)-(FLEE|[1-4])(?: |$)/);
      if (!next || next[1] !== room) break;
      end++;
    }

    var connector = index === start ? '┬' : (index === end ? '└' : '├');

    if (fleeMatch) return room + connector + 'FLEE';
    return room + connector + actionMatch[2] + ' ' + actionMatch[3];
  }

  window.copyLogText = function() {
    var logHistory = state && Array.isArray(state.logHistory)
      ? state.logHistory
      : [];

    if (!logHistory.length) return;

    var logLines = logHistory.map(function(line, index, lines) {
      return boxifyCopiedLog(line, index, lines);
    });

    var logText = logLines.map(function(line) {
      return '• ' + line;
    }).join('\n');

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(logText).then(function() {
        var button = document.getElementById('copyLogBtn');
        if (!button) return;
        var original = button.textContent;
        button.textContent = 'Copied!';
        setTimeout(function() {
          button.textContent = original;
        }, 1200);
      }).catch(function() {
        alert('Could not copy the game log. Please select and copy it manually.');
      });
    } else {
      alert('Could not copy the game log. Please select and copy it manually.');
    }
  };

  /*
   * Fixed challenge deck.
   *
   * PERFECT is a reserved Deck ID which bypasses the normal seeded shuffle.
   * The order below is the 43-card game deck supplied by the player, written
   * in the order the player wants the cards to be DRAWN. The game's deck is
   * dealt from the end of the array, so the stored array is reversed here.
   *
   * The starting 2D dagger is intentionally omitted because it is created by
   * startGame() separately; 2D must not appear in state.deck as well.
   *
   * Card IDs use the same internal representation as cards.js:
   *   clubsK, diamonds10, hearts6, spadesA, etc.
   */
  var PERFECT_DECK_ORDER = [
    'hearts3', 'hearts5', 'hearts6', 'hearts7', 'hearts9', 'hearts10',
    'spades2', 'clubs2',
    'spades3', 'clubs3', 'diamonds3',
    'spades4', 'clubs4', 'diamonds4',
    'spades5', 'clubs5', 'diamonds5',
    'spades6', 'clubs6', 'diamonds6',
    'spades7', 'clubs7', 'diamonds7',
    'spades8', 'clubs8', 'diamonds8',
    'spades9', 'clubs9', 'diamonds9',
    'spades10', 'clubs10', 'hearts2',
    'spadesJ', 'clubsJ', 'hearts4',
    'spadesQ', 'clubsQ', 'hearts6',
    'spadesK', 'clubsK', 'hearts8',
    'spadesA', 'clubsA', 'diamonds10'
  ];

  var originalMakeDeck = null;
  var originalEnterDungeonId = null;

  function buildPerfectDeck() {
    if (typeof originalMakeDeck !== 'function') {
      throw new Error('The card deck is not ready.');
    }

    // Use the game's normal card factory to obtain the correctly themed card
    // objects, then replace only their order.
    var normalDeck = originalMakeDeck(0n);
    var byId = {};

    normalDeck.forEach(function(card) {
      byId[card.id] = card;
    });

    var missing = PERFECT_DECK_ORDER.filter(function(id) { return !byId[id]; });
    if (missing.length) {
      throw new Error('PERFECT deck contains unavailable card(s): ' + missing.join(', '));
    }

    return PERFECT_DECK_ORDER.map(function(id) { return byId[id]; });
  }

  // game.js is loaded after this file. By the time this load handler runs all
  // game functions exist, so install the fixed-deck hook directly here.
  if (typeof window.makeDeck === 'function' && typeof window.enterDungeonId === 'function') {
    originalMakeDeck = window.makeDeck;
    originalEnterDungeonId = window.enterDungeonId;

    window.makeDeck = function(seed) {
      if (window.__deckDungeonPerfectDeck === true) {
        return buildPerfectDeck();
      }
      return originalMakeDeck(seed);
    };

    window.enterDungeonId = function() {
      var input = document.getElementById('deckIdInput');
      var id = input ? input.value.trim() : '';

      if (id.toUpperCase() !== 'PERFECT') {
        return originalEnterDungeonId.call(this);
      }

      if (typeof window.stopDeckDungeonTheme === 'function') {
        window.stopDeckDungeonTheme();
      }

      showScreen('game-ui');
      window.__deckDungeonPerfectDeck = true;
      try {
        window.startGame(undefined, 'PERFECT');
      } catch (error) {
        window.__deckDungeonPerfectDeck = false;
        throw error;
      }
      window.__deckDungeonPerfectDeck = false;
    };
  }
});