/*
 * Dungeon ID / deterministic randomness
 *
 * A Dungeon ID is simply a 64-bit random seed.
 *
 * The seed is used by the game's deterministic PRNG, which feeds the same
 * Fisher-Yates shuffle used for the deck. Therefore:
 *
 *   Dungeon ID -> seed -> PRNG -> shuffle -> starting deck
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
    throw new Error('Dungeon ID must be 11 characters.');
  }

  var seed = 0n;

  for (var i = 0; i < deckId.length; i++) {
    var value = DECK_ID_ALPHABET.indexOf(deckId[i]);

    if (value < 0) {
      throw new Error('Invalid Dungeon ID character.');
    }

    seed = (seed << 6n) | BigInt(value);
  }

  // The first 2 bits of the 66-bit base64 representation are padding and
  // must be zero. This also rejects IDs that cannot represent a 64-bit seed.
  if (seed > 0xffffffffffffffffn) {
    throw new Error('Invalid Dungeon ID.');
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
