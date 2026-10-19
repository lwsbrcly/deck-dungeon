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

  if (state === 0n) state = 0x9e3779b97f4a7c15n;

  return function() {
    state ^= state >> 12n;
    state ^= (state << 25n) & 0xffffffffffffffffn;
    state ^= state >> 27n;
    state &= 0xffffffffffffffffn;

    var result = (state * 0x2545f4914f6cdd1dn) & 0xffffffffffffffffn;

    return Number(result >> 11n) / 9007199254740992;
  };
}

async function seedFromDeck(deck) {
  if (!Array.isArray(deck)) {
    throw new Error('Deck seed requires a deck array.');
  }

  var canonical = deck.map(function(card) {
    return typeof card === 'string' ? card : card.id;
  }).join('|');

  var bytes = new TextEncoder().encode(canonical);
  var digest = await crypto.subtle.digest('SHA-256', bytes);
  var hash = new Uint8Array(digest);

  var seed = 0n;
  for (var i = 0; i < 8; i++) {
    seed = (seed << 8n) | BigInt(hash[i]);
  }

  return seed;
}

function insertSeeded(array, cards, seed) {
  var random = createSeededRandom(seed);
  var inserted = cards.slice();

  for (var i = inserted.length - 1; i > 0; i--) {
    var j = Math.floor(random() * (i + 1));
    var temp = inserted[i];
    inserted[i] = inserted[j];
    inserted[j] = temp;
  }

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
 * Log ordinals
 *
 * Card actions are numbered independently of room-level actions such as FLEE.
 * The ordinal is derived from the surviving event history, so the existing
 * snapshot-based undo system automatically rolls the numbering back with the
 * rest of the game state.
 *
 * Normally every room contributes exactly three card actions. The final room
 * is the one exception: if its fourth card is the final monster, that action
 * is still part of the final room and must be numbered 14.4 rather than 15.1.
 *
 * FLEE is a room transition rather than a card action, so it is numbered N.0
 * for the new room. It can only occur as the first event of that room.
 */
window.addEventListener('load', function() {
  if (typeof window.log !== 'function') return;

  var originalLog = window.log;
  var cardActionTypes = {
    weapon: true,
    monster: true,
    fist: true,
    potion: true
  };

  function isCardAction(text, eventType, recordEvent) {
    if (recordEvent === false) return false;
    if (cardActionTypes[eventType]) return true;

    return /^(?:P1|P2|COOP) .* D$/.test(String(text));
  }

  window.log = function(text, recordEvent, eventType, weaponStrengths) {
    var type = eventType || 'other';
    var originalText = String(text);

    // FLEE is a room-level transition. At the point log() is called,
    // roomsCleared represents the rooms already completed, so the room being
    // entered is roomsCleared + 1.
    if (recordEvent !== false && (type === 'flee' || originalText === 'FLEE')) {
      var fleeRoom = window.state && Number(window.state.roomsCleared) + 1;
      if (fleeRoom > 0) {
        text = fleeRoom + '.0 FLEE';
      }
    } else if (isCardAction(text, type, recordEvent)) {
      var actionCount = 0;
      if (window.state && Array.isArray(window.state.eventHistory)) {
        for (var i = 0; i < window.state.eventHistory.length; i++) {
          var previous = window.state.eventHistory[i];
          // Only .1-.4 are card actions. .0 is the room-level FLEE marker.
          if (previous && /^\d+\.[1-4] /.test(String(previous.text || ''))) {
            actionCount++;
          }
        }
      }

      actionCount += 1;

      var targetRooms = window.state && Number(window.state.targetRooms);
      var finalRoom = targetRooms > 0 && window.state &&
        Number(window.state.roomsCleared) >= targetRooms - 1;
      var finalRoomStart = targetRooms > 0 ? (targetRooms - 1) * 3 + 1 : Infinity;

      var room;
      var actionInRoom;

      if (finalRoom && actionCount >= finalRoomStart) {
        room = targetRooms;
        actionInRoom = actionCount - finalRoomStart + 1;
      } else {
        room = Math.floor((actionCount - 1) / 3) + 1;
        actionInRoom = ((actionCount - 1) % 3) + 1;
      }

      text = room + '.' + actionInRoom + ' ' + originalText;
    }

    return originalLog.call(this, text, recordEvent, eventType, weaponStrengths);
  };
});
