/*
 * Deck ID encoding
 *
 * The Deck ID represents the exact initial card order. It is deliberately
 * independent of theme artwork/names.
 *
 * Format:
 *   DD1-<43 base64url characters>-<6 checksum characters>
 *
 * Each card is represented by its 0-42 catalogue index (6 bits per card).
 * 43 cards therefore require exactly 258 bits / 43 base64url characters.
 *
 * The checksum is only for typo/copy-paste detection. It is not used as
 * gameplay randomness.
 */

var DECK_ID_VERSION = 'DD1';
var DECK_ID_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function getDeckIdCardCatalog() {
  var cards = [];
  var suitKeys = Object.keys(SUITS);

  for (var i = 0; i < suitKeys.length; i++) {
    var suit = suitKeys[i];

    for (var j = 0; j < ranks.length; j++) {
      var rank = ranks[j];

      if ((suit === 'diamonds' || suit === 'hearts') &&
          ['A', 'J', 'Q', 'K'].indexOf(rank) !== -1) {
        continue;
      }

      if (suit === 'diamonds' && rank === '2') continue;

      cards.push(suit + rank);
    }
  }

  return cards;
}

function deckIdEncodeBits(values) {
  var output = '';
  var buffer = 0;
  var bits = 0;

  for (var i = 0; i < values.length; i++) {
    buffer = (buffer * 64) + values[i];
    bits += 6;

    while (bits >= 6) {
      bits -= 6;
      var index = Math.floor(buffer / Math.pow(2, bits)) & 63;
      output += DECK_ID_ALPHABET[index];
      buffer = buffer % Math.pow(2, bits);
    }
  }

  if (bits > 0) {
    output += DECK_ID_ALPHABET[(buffer * Math.pow(2, 6 - bits)) & 63];
  }

  return output;
}

function deckIdDecodeBits(text) {
  var values = [];
  var buffer = 0;
  var bits = 0;

  for (var i = 0; i < text.length; i++) {
    var value = DECK_ID_ALPHABET.indexOf(text[i]);
    if (value < 0) throw new Error('Invalid Deck ID character.');

    buffer = (buffer * 64) + value;
    bits += 6;

    while (bits >= 6) {
      bits -= 6;
      values.push(Math.floor(buffer / Math.pow(2, bits)) & 63);
      buffer = buffer % Math.pow(2, bits);
    }
  }

  return values;
}

// Small synchronous checksum. This is only error detection; SHA-256 will be
// used separately for deterministic Flee randomness.
function deckIdChecksum(text) {
  var hash = 2166136261;

  for (var i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }

  var checksum = '';
  for (var j = 0; j < 6; j++) {
    checksum += DECK_ID_ALPHABET[hash & 63];
    hash = hash >>> 6;
  }

  return checksum;
}

function formatDeckId(data, checksum) {
  return DECK_ID_VERSION + '-' + data + '-' + checksum;
}

function encodeDeckId(deck) {
  if (!Array.isArray(deck)) throw new Error('Deck ID requires a deck array.');

  var catalog = getDeckIdCardCatalog();
  var indexById = {};

  for (var i = 0; i < catalog.length; i++) {
    indexById[catalog[i]] = i;
  }

  if (deck.length !== catalog.length) {
    throw new Error('Deck ID expected ' + catalog.length + ' cards, got ' + deck.length + '.');
  }

  var seen = {};
  var values = [];

  for (var j = 0; j < deck.length; j++) {
    var id = typeof deck[j] === 'string' ? deck[j] : deck[j] && deck[j].id;
    var index = indexById[id];

    if (index === undefined) {
      throw new Error('Deck ID contains unknown card: ' + id);
    }

    if (seen[id]) {
      throw new Error('Deck ID contains duplicate card: ' + id);
    }

    seen[id] = true;
    values.push(index);
  }

  var data = deckIdEncodeBits(values);
  var checksum = deckIdChecksum(DECK_ID_VERSION + '-' + data);

  return formatDeckId(data, checksum);
}

function decodeDeckId(deckId) {
  if (typeof deckId !== 'string') throw new Error('Deck ID must be text.');

  var clean = deckId.replace(/\s+/g, '');
  var parts = clean.split('-');

  if (parts.length !== 3 || parts[0] !== DECK_ID_VERSION) {
    throw new Error('Invalid Deck ID version or format.');
  }

  var data = parts[1];
  var checksum = parts[2];

  if (data.length !== 43 || checksum.length !== 6) {
    throw new Error('Invalid Deck ID length.');
  }

  if (deckIdChecksum(DECK_ID_VERSION + '-' + data) !== checksum) {
    throw new Error('Deck ID checksum failed. Check for a typo.');
  }

  var values = deckIdDecodeBits(data);
  var catalog = getDeckIdCardCatalog();

  if (values.length !== catalog.length) {
    throw new Error('Invalid Deck ID card data.');
  }

  var deck = [];
  var seen = {};

  for (var i = 0; i < values.length; i++) {
    var index = values[i];

    if (index >= catalog.length) {
      throw new Error('Invalid Deck ID card index.');
    }

    var id = catalog[index];

    if (seen[id]) {
      throw new Error('Invalid Deck ID: duplicate card.');
    }

    seen[id] = true;
    deck.push(id);
  }

  return deck;
}
