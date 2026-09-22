const SUITS = {spades:'♠', clubs:'♣', diamonds:'♦', hearts:'♥'};
const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
function value(rank) { return rank==='A'?14:rank==='J'?11:rank==='Q'?12:rank==='K'?13:Number(rank); }

function getThemeCardName(suit, rank) {
  var theme = THEMES[selectedTheme || 'dungeon'];
  if (!theme || !theme.cards) return suit + ' ' + rank;

  var group = null;
  if (suit === 'clubs' || suit === 'spades') group = theme.cards.monsters;
  else if (suit === 'diamonds') group = theme.cards.weapons;
  else if (suit === 'hearts') group = theme.cards.potions;

  return group && group[suit] && group[suit][rank]
    ? group[suit][rank]
    : suit + ' ' + rank;
}

function makeDeck() {
  var d = [];
  var suitKeys = Object.keys(SUITS);
  for (var i = 0; i < suitKeys.length; i++) {
    var suit = suitKeys[i];
    for (var j = 0; j < ranks.length; j++) {
      var rank = ranks[j];
      if ((suit === 'diamonds' || suit === 'hearts') && ['A','J','Q','K'].indexOf(rank) !== -1) continue;
      if (suit === 'diamonds' && rank === '2') continue;
      d.push({
        suit: suit,
        rank: rank,
        value: value(rank),
        name: getThemeCardName(suit, rank),
        id: suit + rank
      });
    }
  }
  return shuffle(d);
}

function shuffle(a) {
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = a[i];
    a[i] = a[j];
    a[j] = temp;
  }
  return a;
}
