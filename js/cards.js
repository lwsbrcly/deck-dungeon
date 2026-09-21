// Card and deck utilities

const CARD_NAMES = {
clubs: {
  '2': 'Rat', '3': 'Cave Spider', '4': 'Wolf', '5': 'Goblin',
  '6': 'Orc', '7': 'Shaman', '8': 'Bandit', '9': 'Gladiator',
  '10': 'Dark Wizard', 'J': 'Minotaur', 'Q': 'Ogre', 'K': 'Giant', 'A': 'Dragon'
},
spades: {
  '2': 'Spooky Fog', '3': 'Slime', '4': 'Snakes', '5': 'Skeleton',
  '6': 'Zombie', '7': 'Ghost', '8': 'Ghoul', '9': 'Wraith',
  '10': 'Necromancer', 'J': 'Vampire', 'Q': 'Mummy', 'K': 'Lich King', 'A': 'Bone Dragon'
},
diamonds: {
  '2': 'Dagger', '3': 'Club', '4': 'Short Sword', '5': 'Mace',
  '6': 'Longsword', '7': 'Battle Axe', '8': 'Warhammer', '9': 'Great Axe', '10': 'Greatsword'
},
hearts: {
  '2': 'Stale Bread', '3': 'Sus Mushrooms', '4': 'Apple', '5': 'Fresh Bread',
  '6': 'Cooked Meats', '7': 'Roast Chicken', '8': 'Hearty Stew', '9': 'Healing Elixir', '10': 'Magic Potion'
}
};

const SUITS = {spades:'♠', clubs:'♣', diamonds:'♦', hearts:'♥'};
const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
function value(rank) { return rank==='A'?14:rank==='J'?11:rank==='Q'?12:rank==='K'?13:Number(rank); }

function makeDeck(excludeDagger) {
var d = [];
var suitKeys = Object.keys(SUITS);
for (var i = 0; i < suitKeys.length; i++) {
  var suit = suitKeys[i];
  for (var j = 0; j < ranks.length; j++) {
    var rank = ranks[j];
    if ((suit === 'diamonds' || suit === 'hearts') && ['A','J','Q','K'].indexOf(rank) !== -1) continue;
    if (excludeDagger && suit === 'diamonds' && rank === '2') continue;
    d.push({
      suit: suit,
      rank: rank,
      value: value(rank),
      name: CARD_NAMES[suit][rank],
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

