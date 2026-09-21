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

function startGame() {
stopDeckDungeonTheme();
var modeInput = document.getElementById('modeSelect');
var mode = modeInput ? modeInput.value : 'solo_dagger';
var p1Val = document.getElementById('p1NameInput').value.trim();
var p2Val = document.getElementById('p2NameInput').value.trim();
var hardMode = document.getElementById('hardModeInput').checked;
var p1Name = p1Val || (mode === 'coop' ? 'Player 1' : 'Player');
var p2Name = p2Val || 'Player 2';
var maxHP = mode === 'coop' ? 10 : 20;

var isDaggerMode = true; //mode !== 'coop';
var initialDeck = makeDeck(isDaggerMode);

historyStack = [];

var starterWeaponP1 = null;
var starterWeaponP2 = null;
var starterCeilingP1 = null;
var starterCeilingP2 = null;

if (isDaggerMode || mode === 'coop') {
  starterWeaponP1 = {
    suit: 'diamonds',
    rank: '2',
    value: 2,
    name: CARD_NAMES['diamonds']['2'],
    id: 'diamonds2'
  };
  starterWeaponP2 = {
    suit: 'diamonds',
    rank: '2',
    value: 2,
    name: CARD_NAMES['diamonds']['2'],
    id: 'diamonds2'
  };
  starterCeilingP1 = 99;
  starterCeilingP2 = 99;
}

state = {
  mode: mode,
  hardMode: hardMode,
  maxHP: maxHP,
  p1Name: p1Name,
  p2Name: p2Name,
  deck: initialDeck,
  totalDeckSize: initialDeck.length,
  dungeon: [], selected: null, justFled: false, over: false,
  monstersSlain: 0,
  roomsCleared: 0,
  roomsFled: 0,
  targetRooms: 14,
  foodConsumed: 0,
  maxFoodHP: 54,
  weaponUsage: {},
  eventHistory: [],
  p1: { hp: maxHP, weapon: starterWeaponP1, ceiling: starterCeilingP1, consumedThisRoom: false, previousMonsters: [] },
  p2: { hp: maxHP, weapon: starterWeaponP2, ceiling: starterCeilingP2, consumedThisRoom: false, previousMonsters: [] },
  combinedUsedThisRoom: false
};

document.getElementById('setupScreen').style.display = 'none';
document.getElementById('game').style.display = 'flex';
document.getElementById('log').innerHTML = '';
document.getElementById('runChart').innerHTML = '';

var playersContainer = document.getElementById('playersContainer');
var p2Panel = document.getElementById('p2Panel');

document.getElementById('p1DisplayName').textContent = p1Name;
document.getElementById('p2DisplayName').textContent = p2Name;

if (mode !== 'coop') {
  p2Panel.style.display = 'none';
  playersContainer.classList.add('solo-mode');
} else {
  p2Panel.style.display = 'flex';
  playersContainer.classList.remove('solo-mode');
}

fillDungeon(); 
log('A new ' + (mode === 'coop' ? 'co-op' : 'solo') + ' run begins.',false); 
if (isDaggerMode) {
  log(p1Name + ' enters the dungeon wielding a Dagger (2♦).');
} else if (mode === 'coop') {
  log(p1Name + ' and ' + p2Name + ' enter the dungeon wielding Daggers (2♦).');
}
render();
animateRoomEntry();
}

function resetRoomLimits() {
state.p1.consumedThisRoom = false;
state.p2.consumedThisRoom = false;
state.combinedUsedThisRoom = false;
}

function fillDungeon() {
if (state.dungeon.length === 0 || state.dungeon.length === 1) {
  if (state.dungeon.length === 1) {
    state.roomsCleared++;
  }
  resetRoomLimits();
  while (state.dungeon.length < 4 && state.deck.length) {
    state.dungeon.push(state.deck.pop());
  }
}
}

function refreshDungeon() {
if (state.justFled || state.over || state.dungeon.length < 4 || state.deck.length === 0) return;
saveState();

var oldCardEls = Array.prototype.slice.call(document.querySelectorAll('#dungeon .dungeon-card-wrap .card'));
var fledCards = state.dungeon.slice();
state.dungeon = [];

resetRoomLimits();

// Deal the replacement room from the untouched deck first. Normally there
// are at least 4 cards available, so this simply deals a full room. At the
// end of a Starter Dagger run there can be exactly 3 cards left: deal those
// 3 first, then shuffle the fled room back in and draw one random card to
// make the replacement room a full 4 cards.
while (state.dungeon.length < 4 && state.deck.length > 0) {
  state.dungeon.push(state.deck.pop());
}

// Now return the fled room to the deck. If only 3 untouched cards remained,
// this also supplies the fourth card needed for the new room.
state.deck.push.apply(state.deck, fledCards);
shuffle(state.deck);

while (state.dungeon.length < 4 && state.deck.length > 0) {
  state.dungeon.push(state.deck.pop());
}

state.selected = null;
state.justFled = true;
state.roomsFled++;
log('Fled the room.', true, 'flee');
checkGame();
// Flee animation is purely visual; deal the new room after the old cards leave.
animateFlee(oldCardEls).then(function() {
  // Do not render the replacement room until every fleeing card has
  // reported that its animation is finished. Then wait one paint frame
  // before starting the first incoming card.
  render();
  animateRoomEntry();
});
}

function selectCard(i) {
if (state.over) return;
state.selected = i;
render();
}

function cardHTML(c, customCornerText) {
if (!c) return '';
var red = c.suit === 'hearts' || c.suit === 'diamonds';
var cornerText = customCornerText !== undefined ? customCornerText : (c.rank + '<br>' + SUITS[c.suit]);

// Render custom SVG Artwork depending on card type:
var centerArt = '';
if (c.suit === 'clubs' && c.rank === 'A') {
  centerArt = '<div class="card-art">' + DRAGON_SVG + '</div>';
} else if (c.suit === 'spades' && c.rank === 'A') {
  centerArt = '<div class="card-art">' + BONE_DRAGON_SVG + '</div>';
} else if (c.suit === 'hearts' && c.rank === '2') {
  centerArt = '<div class="card-art">' + STALE_BREAD_SVG + '</div>';
} else if (c.suit === 'hearts' && c.rank === '3') {
  centerArt = '<div class="card-art">' + MUSHROOMS_SVG + '</div>';
} else if (c.suit === 'hearts' && c.rank === '4') {
  centerArt = '<div class="card-art">' + APPLE_SVG + '</div>';
} else if (c.suit === 'hearts' && c.rank === '5') {
  centerArt = '<div class="card-art">' + BREAD_SVG + '</div>';
} else if (c.suit === 'hearts' && c.rank === '6') {
  centerArt = '<div class="card-art">' + COOKED_MEATS_SVG + '</div>';
} else if (c.suit === 'hearts' && c.rank === '7') {
  centerArt = '<div class="card-art">' + ROAST_CHICKEN_SVG + '</div>';
} else if (c.suit === 'hearts' && c.rank === '8') {
  centerArt = '<div class="card-art">' + HEARTY_STEW_SVG + '</div>';
} else if (c.suit === 'hearts' && c.rank === '9') {
  centerArt = '<div class="card-art">' + HEALING_ELIXIR_SVG + '</div>';
} else if (c.suit === 'hearts' && c.rank === '10') {
  centerArt = '<div class="card-art">' + MAGIC_POTION_SVG + '</div>';
} else if (c.suit === 'diamonds' && c.rank === '2') {
  centerArt = '<div class="card-art">' + DAGGER_SVG + '</div>';
} else if (c.suit === 'diamonds' && c.rank === '3') {
  centerArt = '<div class="card-art">' + CLUB_SVG + '</div>';
} else if (c.suit === 'diamonds' && c.rank === '4') {
  centerArt = '<div class="card-art">' + SHORT_SWORD_SVG + '</div>';
} else if (c.suit === 'diamonds' && c.rank === '6') {
  centerArt = '<div class="card-art">' + LONG_SWORD_SVG + '</div>';
} else if (c.suit === 'diamonds' && c.rank === '9') {
  centerArt = '<div class="card-art">' + GREATAXE_SVG + '</div>';
} else if (c.suit === 'diamonds' && c.rank === '10') {
  centerArt = '<div class="card-art">' + GREATSWORD_SVG + '</div>';
} else {
  centerArt = '<div class="suitbig">' + SUITS[c.suit] + '</div>';
}

return '<div class="card ' + (red ? 'red' : 'black') + '">' +
  '<div class="card-rank">' + cornerText + '</div>' +
  centerArt +
  '<div class="card-title">' + c.name + '</div>' +
'</div>';
}

