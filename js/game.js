let selectedTheme = null;

function applySelectedTheme() {
    var theme = THEMES[selectedTheme || 'dungeon'];
    if (!theme) return;

    var colours = theme.colours || {};
    var root = document.documentElement;

    root.style.setProperty('--bg', colours.bg || '');
    root.style.setProperty('--card-bg', colours.cardBg || '');
    root.style.setProperty('--panel-bg', colours.panelBg || '');
    root.style.setProperty('--border', colours.border || '');
    root.style.setProperty('--text', colours.text || '');
    root.style.setProperty('--muted', colours.muted || '');
    root.style.setProperty('--highlight', colours.highlight || '');
    root.style.setProperty('--red', colours.red || '');
    root.style.setProperty('--rooms', colours.rooms || '');

    root.style.setProperty('--card-image', 'url("' + theme.artwork.card + '")');
    root.style.setProperty('--card-back-image', 'url("' + theme.artwork.back + '")');
}

function selectTheme(theme) {
    if (!THEMES[theme]) return;

    selectedTheme = theme;
    applySelectedTheme();
    showScreen('rules');
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    document.getElementById(screenId).classList.add('active');
}

function enterGame() {
    showScreen('game-ui');
    startGame();
}



// Custom SVG Dragon for Ace cards
var activeGhostMemoryId = null;

var state = {};
var historyStack = [];

function stopDeckDungeonTheme() {
    if (!themeNodes.length || !audioContext) return;
    const now = audioContext.currentTime;
    themeNodes.forEach(function(node) {
      try { node.stop(now); } catch (e) {}
    });
    themeNodes = [];
}

function saveState() {
    historyStack.push(JSON.parse(JSON.stringify(state)));
    if (historyStack.length > 30) historyStack.shift();
}

function resetDungeonDom() {
  // Undo is a hard state restoration. Any FLIP transform left on a reused
  // card belongs to the action we are undoing, not to the restored state.
  var dungeonEl = document.getElementById('dungeon');
  if (!dungeonEl) return;
  var wraps = dungeonEl.querySelectorAll('.dungeon-card-wrap');
  for (var i = 0; i < wraps.length; i++) {
    wraps[i].style.transition = 'none';
    wraps[i].style.transform = 'none';
    wraps[i].style.left = '';
    wraps[i].style.top = '';
    wraps[i].style.width = '';
    wraps[i].style.height = '';
  }
}

function undoLastAction() {
    if (historyStack.length === 0) return;
    resetDungeonDom();
    state = historyStack.pop();
    log('Undid last action.', false);
    render();
}

function undoFromGameOver() {
    if (historyStack.length === 0) return;
    resetDungeonDom();
    state = historyStack.pop();
    state.over = false;
    document.getElementById('overlay').classList.remove('show');
    log('Undid fatal last action.', false);
    render();
}

function toggleModeInputs() {
    var modeSelect = document.getElementById('modeSelect');
    var mode = modeSelect ? modeSelect.value : 'solo_dagger';
    var p2Group = document.getElementById('p2Group');
    var p1Label = document.querySelector('#p1Group label');
    var setupRules = document.getElementById('setupRulesText');
    
    var baseRules = '<h3>Goal of the Game</h3>' +
      '<p style="margin-bottom: 8px;">Clear all cards to complete the deck!</p>' +
      '<h3>Cards & Rules</h3>' +
      '<ul>' +
        '<li><strong>Standard deck of cards:</strong> J, Q, K, A of both Diamonds & Hearts are removed. The remaining 44 cards form <strong>the deck.</strong></li>' + 
        '<li><strong>♠ Clubs & Spades = Monsters:</strong> Fight them with your equipped weapon, or bare-handed.</li>' +
        '<li><strong>♦ Diamonds = Weapons:</strong> Equip one at a time. Deflect incoming damage, up to your weapon\'s value. Can only be used against monsters' +
        'less than or equal to previous monster slain.</li>' +
        '<li><strong>♥ Hearts = Consumables:</strong> Restore lost HP, up to your maximum health. Only 1 per room allowed!</li>' +
      '</ul>' +
      '<h3>Game Mechanics</h3>' +
      '<ul>' +,
        '<li><strong>Clear Room:</strong> Action 3 cards to clear room. The 4th card becomes the 1st card in the next room - 3 new cards are dealt.</li>' +
        '<li><strong>Damage:</strong> Monsters deal damage equal to their value minus your equipped weapon\'s value.</li>' +
        '<li><strong>Health Points:</strong> Start with 20 HP. Cannot heal above that limit. If you reach 0 it\'s game over!</li>' +
        '<li><strong>Discard:</strong> Don\'t want to lose your current weapon? Don\'t want to fight that last monster? <em>Discard</em> unwanted weapon/consumable cards to action them and move on.</li>' +
        '<li><strong>Fleeing:</strong> Press <em>Flee</em> to skip a room - 4 new cards are dealt. Fled cards are shuffled back into the deck for later.' +
        'You cannot flee twice in a row, so use it wisely!.</li>' +
      '</ul>';
    
    if (mode === 'coop') {
      if (p2Group) p2Group.style.display = 'block';
      if (p1Label) p1Label.textContent = 'Player 1 Name';
      if (setupRules) {
        setupRules.innerHTML = baseRules + 
          '<h3>Co-op Hardcore Rules</h3>' +
          '<ul>' +
            '<li><strong>HP Limit:</strong> Both heroes start with 10 HP.</li>' +
            '<li><strong>Starting Weapons:</strong> Both heroes begin with a <strong>2♦ Dagger</strong> equipped.</li>' +
            '<li><strong>2v1 Attacks:</strong> Team up with weapons or fists against a monster to split incoming damage evenly.</li>' +
            '<li><strong>Revives:</strong> Revive a downed ally with (Card Value / 2) + 1 HP.</li>' +
          '</ul>';
      }
    } 
}

function showSetupScreen() {
    document.getElementById('setupScreen').style.display = 'block';
    document.getElementById('game').style.display = 'none';
    toggleModeInputs();
}

function replayGame() {
    document.getElementById('overlay').classList.remove('show');
    showScreen('game-ui');
    startGame();
}

function backToMenu() {
    document.getElementById('overlay').classList.remove('show');
    document.getElementById('game').style.display = 'none';
    document.getElementById('setupScreen').style.display = 'block';
    showScreen('game-selector');
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
    name: getThemeCardName('diamonds', '2'),
    id: 'diamonds2'
  };
  starterWeaponP2 = {
    suit: 'diamonds',
    rank: '2',
    value: 2,
    name: getThemeCardName('diamonds', '2'),
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
var firstRoom = state.dungeon.slice();
state.dungeon = [];

log('A new ' + (mode === 'coop' ? 'co-op' : 'solo') + ' run begins.',false); 
if (isDaggerMode) {
  log(p1Name + ' enters the dungeon wielding a Dagger (2♦).');
} else if (mode === 'coop') {
  log(p1Name + ' and ' + p2Name + ' enter the dungeon wielding Daggers (2♦).');
}

// First render the stable layout with no dungeon cards.
// Then, on the next frame, put the room cards in place and start the deal.
render();
requestAnimationFrame(function() {
  state.dungeon = firstRoom;
  render();
  requestAnimationFrame(function() {
    animateRoomEntry();
  });
});
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
    
    // Render custom SVG Artwork for the selected theme.
    var centerArt = '';
    var theme = THEMES[selectedTheme || 'dungeon'];
    var svgArt = theme && theme.artwork && theme.artwork.svgCards
      ? theme.artwork.svgCards[c.suit + '_' + c.rank]
      : null;
    
    if (svgArt) {
      centerArt = '<div class="card-art">' + svgArt + '</div>';
    } else {
      centerArt = '<div class="suitbig">' + SUITS[c.suit] + '</div>';
    }
    var cardArtwork = (THEMES[selectedTheme || 'dungeon'] && THEMES[selectedTheme || 'dungeon'].artwork)
      ? THEMES[selectedTheme || 'dungeon'].artwork.card
      : 'assets/dungeon/card.png';
    
    return '<div class="card ' + (red ? 'red' : 'black') + '" style="background-image: url(' + cardArtwork + ');">' +
      '<div class="card-rank">' + cornerText + '</div>' +
      centerArt +
      '<div class="card-title">' + c.name + '</div>' +
    '</div>';
    }
    
function removeSelected() {
    var c = state.dungeon.splice(state.selected, 1)[0];
    state.selected = null;
    state.justFled = false;
    var before = state.dungeon.length;
    
    // If this action just killed the player(s), do not deal another room.
    // checkGame() will show the game-over overlay immediately afterwards.
    var isSolo = state.mode !== 'coop';
    var isDead = isSolo ? state.p1.hp <= 0 : (state.p1.hp <= 0 && state.p2.hp <= 0);
    
    if (!isDead) {
      fillDungeon();
    }
    
    state._roomWasDealt = !isDead && (before <= 1 && state.dungeon.length > before);
    state._skipFirstRoomCard = state._roomWasDealt && before === 1;
    return c;
}

function renderAfterAction() {
var animateRoom = !!state._roomWasDealt;
var skipFirst = !!state._skipFirstRoomCard;

// Capture where the existing dungeon cards are before the state-driven render.
var before = {};
var currentWraps = document.querySelectorAll('#dungeon .dungeon-card-wrap');
for (var i = 0; i < currentWraps.length; i++) {
  var wrap = currentWraps[i];
  if (wrap._cardKey) before[wrap._cardKey] = wrap.getBoundingClientRect();
}

state._roomWasDealt = false;
state._skipFirstRoomCard = false;
render();

// FLIP the cards that survived the action. The real card elements stay alive;
// only their position changes, so the browser animates the slide naturally.
var moved = [];
var afterWraps = document.querySelectorAll('#dungeon .dungeon-card-wrap');
for (var j = 0; j < afterWraps.length; j++) {
  var afterWrap = afterWraps[j];
  var oldRect = before[afterWrap._cardKey];
  if (!oldRect) continue;

  var newRect = afterWrap.getBoundingClientRect();
  var dx = oldRect.left - newRect.left;
  var dy = oldRect.top - newRect.top;

  if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
    afterWrap.style.transition = 'none';
    afterWrap.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
    moved.push(afterWrap);
  }
}

if (moved.length) {
  // Force the starting transform to be painted before releasing it.
  void document.getElementById('dungeon').offsetWidth;
  requestAnimationFrame(function() {
    for (var m = 0; m < moved.length; m++) {
      moved[m].style.transition = 'transform 420ms cubic-bezier(.22,.8,.28,1)';
      moved[m].style.transform = 'translate(0, 0)';
    }
    setTimeout(function() {
      for (var n = 0; n < moved.length; n++) {
        moved[n].style.transition = '';
        moved[n].style.transform = '';
      }
    }, 450);
  });
}

if (animateRoom) animateRoomEntry(skipFirst);
}

function animateCardAction(cardEl, targetEl, className, done, icon) {
if (!cardEl) { done(); return; }
// Remove the selection highlight without re-rendering the dungeon.
if (state.selected !== null) {
  cardEl.classList.remove('selected');
}
var a = cardEl.getBoundingClientRect();
var b = targetEl ? targetEl.getBoundingClientRect() : null;
var clone = cardEl.cloneNode(true);
clone.classList.add('action-clone', className);
clone.style.left = a.left + 'px';
clone.style.top = a.top + 'px';
clone.style.width = a.width + 'px';
clone.style.height = a.height + 'px';
if (b) {
  var targetX = b.left + b.width / 2;
  var targetY = b.top + b.height / 2;
  if (className.indexOf('equip') !== -1) {
    var slot = targetEl.parentElement;
    var sr = slot ? slot.getBoundingClientRect() : b;
    targetX = sr.left + sr.width / 2;
    targetY = sr.top + sr.height / 2;
  } else if (className.indexOf('consume') !== -1) {
    // Aim at the player's card row rather than the panel centre.
    var cardSlots = targetEl.querySelector('.player-card-slots');
    var cr = cardSlots ? cardSlots.getBoundingClientRect() : b;
    targetX = cr.left + cr.width / 2;
    targetY = cr.top + cr.height / 2;
  }
  clone.style.setProperty('--dx', (targetX - (a.left + a.width/2)) + 'px');
  clone.style.setProperty('--dy', (targetY - (a.top + a.height/2)) + 'px');
  clone.style.setProperty('--hit-x', '0px');
  clone.style.setProperty('--hit-y', '0px');
}
cardEl.classList.add('action-hidden');
document.body.appendChild(clone);
if (icon && b) {
  setTimeout(function() {
    var impact = document.createElement('div');
    impact.className = 'action-impact' + (icon === '♥' ? ' heart-impact' : '');
    impact.textContent = icon;
    impact.style.left = (b.left + b.width/2) + 'px';
    impact.style.top = (b.top + b.height/2) + 'px';
    document.body.appendChild(impact);
    setTimeout(function(){ impact.remove(); }, 280);
  }, 230);
}
if (className.indexOf('equip') !== -1 && b) {
  // The slam happens at roughly 62% of the animation. Make the landing
  // feel physical: sparks + a quick screen shake at the exact impact.
  setTimeout(function() {
    var sparks = document.createElement('div');
    sparks.className = 'equip-sparks';
    sparks.style.left = (b.left + b.width / 2) + 'px';
    sparks.style.top = (b.top + b.height / 2) + 'px';
    document.body.appendChild(sparks);
    var game = document.getElementById('game');
    if (game) {
      game.classList.remove('combat-shake');
      void game.offsetWidth;
      game.classList.add('combat-shake');
      setTimeout(function(){ game.classList.remove('combat-shake'); }, 170);
    }
    setTimeout(function(){ sparks.remove(); }, 320);
  }, 403);
  // Weapon lands with the same timing as the visual slam.
  setTimeout(function() { weaponEquipSound(); }, 100);
}
if (className.indexOf('discard') !== -1) {
  discardSound();
} else if (className.indexOf('consume') !== -1) {
  setTimeout(function() { eatFoodSound(); }, 0);
}
var duration = className.indexOf('discard') !== -1 ? 570 : (className.indexOf('equip') !== -1 ? 650 : 440);
setTimeout(function() { clone.remove(); cardEl.classList.remove('action-hidden'); done(); }, duration);
}

function waitForAnimation(el) {
    return new Promise(function(resolve) {
      var finished = false;
      function done() {
        if (finished) return;
        finished = true;
        el.removeEventListener('animationend', done);
        resolve();
      }
      el.addEventListener('animationend', done);
    });
}

async function animateRoomEntry(skipFirst) {
var cards = document.querySelectorAll('#dungeon .dungeon-card-wrap .card:not(.empty)');
var startIndex = skipFirst ? 1 : 0;
var animated = [];
var deckEl = document.getElementById('p1Deck');
var deckRect = deckEl ? deckEl.getBoundingClientRect() : null;

// Deal each card from the deck, with a small stagger so they arrive
// one at a time rather than looking like a single group movement.
for (var i = startIndex; i < cards.length; i++) {
  var card = cards[i];
  var rect = card.getBoundingClientRect();
  var clone = document.createElement('div');
  clone.className = 'action-clone enter-card';
  // The top card is the last rendered deck layer. That layer is
  // offset slightly up/left from the dotted deck box, so start the
  // animation from the visible centre of that top card rather than
  // from the bottom layer underneath it.
  var deckDepth = deckRect ? Math.ceil(state.deck.length / 3) : 0;
  var deckTopOffset = -(deckDepth / 2);
  var dealStartLeft = deckRect ? deckRect.left + deckTopOffset : rect.left;
  var dealStartTop = deckRect ? deckRect.top + deckTopOffset : rect.top;

  clone.style.left = dealStartLeft + 'px';
  clone.style.top = dealStartTop + 'px';
  clone.style.width = rect.width + 'px';
  clone.style.height = rect.height + 'px';
  clone.style.setProperty('--deal-delay', ((i - startIndex) * 150) + 'ms');

  if (deckRect) {
    // Use top-left coordinates so the flight path is exact.
    clone.style.setProperty('--dx', (rect.left - dealStartLeft) + 'px');
    clone.style.setProperty('--dy', (rect.top - dealStartTop) + 'px');
  } else {
    clone.style.setProperty('--dx', '0px');
    clone.style.setProperty('--dy', '0px');
  }

  // Build a real two-sided card. Both faces stay in place for the
  // entire animation; the wrapper itself performs the Y rotation.
  var back = document.createElement('img');
  back.className = 'deal-card-back';
  back.src = THEMES[selectedTheme || 'dungeon'].artwork.back;
  back.alt = '';

  var front = card.cloneNode(true);
  front.classList.add('deal-card-front');

  clone.appendChild(back);
  clone.appendChild(front);

  card.classList.add('action-hidden');
  document.body.appendChild(clone);
  animated.push({ clone: clone, card: card });
}

if (!animated.length) return;

// Match the card-entry animation with one whoosh per incoming card.
dealCardsSound(animated.length);

await new Promise(function(resolve) { requestAnimationFrame(resolve); });

await Promise.all(animated.map(function(item) {
  return waitForAnimation(item.clone).then(function() {
    item.clone.remove();
    item.card.classList.remove('action-hidden');
  });
}));
}

async function animateFlee(cards) {
if (!cards || !cards.length) return;

// Sound begins with the room fleeing.
fleeSound();

var deckEl = document.getElementById('p1Deck');
var deckRect = deckEl ? deckEl.getBoundingClientRect() : null;

// All four cards return to the deck together. The only wait here is until
// the entire fleeing room has finished, so the replacement room cannot appear early.
var waits = [];
for (var i = 0; i < cards.length; i++) {
  var card = cards[i];
  var rect = card.getBoundingClientRect();
  var clone = card.cloneNode(true);
  clone.classList.add('action-clone','flee-clone');
  clone.style.left = rect.left + 'px';
  clone.style.top = rect.top + 'px';
  clone.style.width = rect.width + 'px';
  clone.style.height = rect.height + 'px';

  if (deckRect) {
    clone.style.setProperty('--dx', (deckRect.left + deckRect.width / 2 - (rect.left + rect.width / 2)) + 'px');
    clone.style.setProperty('--dy', (deckRect.top + deckRect.height / 2 - (rect.top + rect.height / 2)) + 'px');
  } else {
    clone.style.setProperty('--dx', -(rect.left + rect.width + 80) + 'px');
    clone.style.setProperty('--dy', ((i%2 ? -1 : 1) * (8 + i*3)) + 'px');
  }

  card.classList.add('action-hidden');
  document.body.appendChild(clone);
  waits.push(waitForAnimation(clone).then(function(c, el) {
    return function() {
      c.remove();
      el.classList.remove('action-hidden');
    };
  }(clone, card)));
}
await Promise.all(waits);
}

function animateMonsterToPrevious(cardEl, targetEl, monster, done) {
if (!cardEl || !targetEl) { done(); return; }

var a = cardEl.getBoundingClientRect();
var b = targetEl.getBoundingClientRect();
var clone = cardEl.cloneNode(true);
clone.classList.add('action-clone', 'monster-equip-clone');
clone.style.left = a.left + 'px';
clone.style.top = a.top + 'px';
clone.style.width = a.width + 'px';
clone.style.height = a.height + 'px';

var targetX = b.left + b.width / 2 + (monster.stackX || 0);
var targetY = b.top + b.height / 2 + (monster.stackY || 0);
clone.style.setProperty('--dx', (targetX - (a.left + a.width / 2)) + 'px');
clone.style.setProperty('--dy', (targetY - (a.top + a.height / 2)) + 'px');
clone.style.setProperty('--stack-rotation', (monster.stackRotation || 0) + 'deg');

cardEl.classList.add('action-hidden');
document.body.appendChild(clone);

setTimeout(function() {
  clone.remove();
  cardEl.classList.remove('action-hidden');
  done();
}, 650);
}

function equipWeapon(player) {
if (state.over || state.selected === null) return;
var c = state.dungeon[state.selected], p = state[player];
if (p.hp <= 0) { log(name(player) + ' is Downed and cannot take weapons.'); return; }
var cardEl = getDungeonCardElement(state.selected);
var targetEl = document.getElementById(player + 'Weapon');
saveState();
var old = p.weapon;

var previousStack = player === 'p1' ? document.querySelectorAll('#p1PreviousMonster .previous-monster-card .card') : [];

function clearPreviousMonsters() {
  if (!previousStack.length) return;

  discardSound();
  for (var i = 0; i < previousStack.length; i++) {
    var monsterCardEl = previousStack[i];
    var rect = monsterCardEl.getBoundingClientRect();
    var clone = monsterCardEl.cloneNode(true);
    clone.classList.add('action-clone', 'previous-monster-discard-clone');
    clone.style.left = rect.left + 'px';
    clone.style.top = rect.top + 'px';
    clone.style.width = rect.width + 'px';
    clone.style.height = rect.height + 'px';
    clone.style.setProperty('--dx', (window.innerWidth - rect.left + 80) + 'px');
    clone.style.setProperty('--dy', ((i % 2 ? -1 : 1) * (8 + i * 3)) + 'px');
    monsterCardEl.classList.add('action-hidden');
    document.body.appendChild(clone);

    clone.addEventListener('animationend', function() {
      clone.remove();
    }, { once: true });
  }
}

var finishEquip = function() {
  p.weapon = c;
  p.ceiling = 99;
  if (player === 'p1') p.previousMonsters = [];
  removeSelected();
  log(name(player) + ' equips ' + c.name + ' (' + c.rank + SUITS[c.suit] + ').' + (old ? ' (' + old.name + ' discarded)' : ''), true, 'weapon', player === 'p1' ? {p1:c.value,p2:null} : {p1:null,p2:c.value});
  checkGame(); renderAfterAction();
};

// Start both animations together.
clearPreviousMonsters();
animateCardAction(cardEl, targetEl, 'equip-clone', finishEquip);
}

function discardDungeonWeapon() {
    if (state.over || state.selected === null) return;
    var cardEl = getDungeonCardElement(state.selected);
    saveState();
    animateCardAction(cardEl, null, 'discard-clone', function() {
      var c = removeSelected(); log('Discarded the ' + c.name + ' (' + c.rank + SUITS[c.suit] + ').'); checkGame(); renderAfterAction();
    });
}

function discardDungeonPotion() {
    if (state.over || state.selected === null) return;
    var cardEl = getDungeonCardElement(state.selected);
    saveState();
    animateCardAction(cardEl, null, 'discard-clone', function() {
      var c = removeSelected(); log('Discarded the ' + c.name + ' (' + c.value + ' HP).'); checkGame(); renderAfterAction();
    });
}

function drinkDirectPotion(target) {
    if (state.over || state.selected === null) return;
    var t = state[target];
    var cardEl = getDungeonCardElement(state.selected);
    var targetEl = document.getElementById(target + 'Panel');
    saveState();
    var c = state.dungeon[state.selected];
    animateCardAction(cardEl, targetEl, 'consume-clone', function() {
      var isDowned = t.hp === 0; var amount = 0;
      if (!t.consumedThisRoom) {
        amount = isDowned ? Math.floor(c.value / 2) + 1 : c.value;
        var actualHeal = Math.min(state.maxHP - t.hp, amount); t.hp = Math.min(state.maxHP, t.hp + amount); t.consumedThisRoom = true;
        if (actualHeal > 0) state.foodConsumed += actualHeal;
        if (isDowned) log(name(target) + ' was revived by ' + c.name + ' with ' + amount + ' HP!', true, 'potion');
        else log(name(target) + ' consumes ' + c.name + ', restoring ' + amount + ' HP.', true, 'potion');
      } else log(name(target) + ' consumed ' + c.name + ', but to no effect.', false, 'potion');
      removeSelected(); checkGame(); renderAfterAction();
    }, '♥');
}

function validWeapon(p, c) {
    if (!p.weapon || p.ceiling === null) return false;
    return state.hardMode ? c.value < p.ceiling : c.value <= p.ceiling;
}

function trackWeaponKill(weaponName, monsterValue) {
    if (!state.weaponUsage[weaponName]) {
      state.weaponUsage[weaponName] = { uses: 0, ptsSlain: 0 };
    }
    state.weaponUsage[weaponName].uses += 1;
    state.weaponUsage[weaponName].ptsSlain += monsterValue;
}

function animateAttack(player, targetEl, done, isFistFight, ghostInfo) {
if (!targetEl) { done(); return; }

var sourceEl = null;
var sourceRect;
var targetRect;
var clone;
var ghost = null;

if (isFistFight) {
  // Bare-handed combat: the monster itself lunges up at the player.
  sourceEl = targetEl;
  targetRect = (player === 'both'
    ? document.getElementById('p1Panel').getBoundingClientRect()
    : document.getElementById(player + 'Panel').getBoundingClientRect());
} else if (player === 'p1' || player === 'p2') {
  // Weapon combat: the weapon travels to the monster while rising,
  // then slams down. The monster disappears at impact and its memory
  // begins materialising on the previous-monster stack immediately.
  sourceEl = document.querySelector('#' + player + 'Weapon .card');
  targetRect = targetEl.getBoundingClientRect();
}

if (!sourceEl) { done(); return; }

sourceRect = sourceEl.getBoundingClientRect();
var sourceX = sourceRect.left + sourceRect.width / 2;
var sourceY = sourceRect.top + sourceRect.height / 2;
var targetX = targetRect.left + targetRect.width / 2;
var targetY = targetRect.top + targetRect.height / 2;

clone = sourceEl.cloneNode(true);
clone.classList.add('combat-clone');
if (isFistFight) {
  clone.classList.add('combat-monster');
} else {
  clone.classList.add('combat-weapon');
}
clone.style.left = sourceRect.left + 'px';
clone.style.top = sourceRect.top + 'px';
clone.style.width = sourceRect.width + 'px';
clone.style.height = sourceRect.height + 'px';
clone.style.setProperty('--dx', (targetX - sourceX) + 'px');
clone.style.setProperty('--dy', (targetY - sourceY) + 'px');
clone.style.setProperty('--hit-x', isFistFight ? '-5px' : '5px');

if (!isFistFight) {
  var strikeDx = targetX - sourceX;
  var strikeDy = targetY - sourceY;
  clone.style.setProperty('--strike-dx', strikeDx + 'px');
  clone.style.setProperty('--strike-dy', strikeDy + 'px');
}
clone.style.setProperty('--hit-y', isFistFight ? '3px' : '-3px');

// Hide the real weapon while its animated copy is moving.
sourceEl.classList.add('combat-hidden');
document.body.appendChild(clone);

if (isFistFight) ughSound(); else punchSound();

setTimeout(function() {
  document.getElementById('game').classList.add('combat-shake');

  var impact = document.createElement('div');
  impact.className = 'combat-impact';
  impact.textContent = isFistFight ? '💥' : '⚔';
  impact.style.left = targetX + 'px';
  impact.style.top = targetY + 'px';
  document.body.appendChild(impact);

  // A weapon kill makes the monster leave the board at the moment of impact.
  // At the same moment, its memory is placed on the stack and begins a
  // long, quiet fade into existence.
  if (!isFistFight) {
    targetEl.classList.add('combat-hidden');

    if (ghostInfo && ghostInfo.targetEl && ghostInfo.monster) {
      // Keep the newly-created memory hidden across the normal game render
      // while the separate ghost clone materialises over the existing stack.
      activeGhostMemoryId = ghostInfo.monster._ghostId;
      var ghostTarget = ghostInfo.targetEl.getBoundingClientRect();
      ghost = targetEl.cloneNode(true);
      // targetEl is already hidden at impact, so remove that state from the
      // clone. The ghost must be visible at opacity 0 for the full fade.
      ghost.classList.remove('combat-hidden');
      ghost.classList.add('combat-ghost');
      ghost.style.left = ghostTarget.left + 'px';
      ghost.style.top = ghostTarget.top + 'px';
      ghost.style.width = ghostTarget.width + 'px';
      ghost.style.height = ghostTarget.height + 'px';
      ghost.style.setProperty('--ghost-x', (ghostInfo.monster.stackX || 0) + 'px');
      ghost.style.setProperty('--ghost-y', (ghostInfo.monster.stackY || 0) + 'px');
      ghost.style.setProperty('--ghost-rotation', (ghostInfo.monster.stackRotation || 0) + 'deg');
      document.body.appendChild(ghost);
    }
  }

  setTimeout(function() { impact.remove(); }, 280);
  setTimeout(function() { document.getElementById('game').classList.remove('combat-shake'); }, 160);
}, isFistFight ? 210 : 476);

setTimeout(function() {
  clone.remove();
  sourceEl.classList.remove('combat-hidden');

  if (!isFistFight && ghost) {
    // The ghost is purely visual. Let the game state/UI commit immediately
    // when the weapon returns; the ghost can finish fading independently.
    setTimeout(function() {
      ghost.remove();
      activeGhostMemoryId = null;
      render();
    }, 1000);
    targetEl.classList.remove('combat-hidden');
    done();
    return;
  }

  if (!isFistFight) {
    targetEl.classList.remove('combat-hidden');
  }
  done();
}, isFistFight ? 430 : 700);
}

function getDungeonCardElement(slotIndex) {
    var wraps = document.querySelectorAll('#dungeon .dungeon-card-wrap');
    for (var i = 0; i < wraps.length; i++) {
      if (wraps[i]._slotIndex === slotIndex) {
        return wraps[i].querySelector('.card');
      }
    }
    return null;
}

function fight(player, mode) {
    if (state.over || state.selected === null) return;
    var c = state.dungeon[state.selected];
    if (['spades','clubs'].indexOf(c.suit) === -1) return;
    
    var targetEl = getDungeonCardElement(state.selected);
    
    if (player === 'both') {
      var a = state.p1, b = state.p2;
      if (state.combinedUsedThisRoom) { log('Combined action already used this room.'); return; }
      if (a.hp <= 0 || b.hp <= 0) { log('Both players must be standing.'); return; }
    
      if (mode === 'combined_bare') {
        saveState();
        animateAttack('both', targetEl, function() {
          var totalDamage = c.value;
          applySharedDamage(totalDamage, 'p1');
          state.combinedUsedThisRoom = true;
          state.monstersSlain++;
          trackWeaponKill('Bare Fists', c.value);
          removeSelected();
          log('Both heroes team up vs ' + c.name + '. Took ' + totalDamage + ' damage split between them.', true, 'fist');
          checkGame();
          renderAfterAction();
        }, true);
      } else {
        if (!a.weapon || !b.weapon || a.ceiling === null || b.ceiling === null || c.value > (a.ceiling + b.ceiling)) { log('Cannot combine weapons.'); return; }
        saveState();
        animateAttack('p1', targetEl, function() {
          var power = a.weapon.value + b.weapon.value;
          var damage = Math.max(0, c.value - power);
          applySharedDamage(damage, 'p1');
          var targetCeiling = Math.floor(c.value / 2);
          a.ceiling = Math.min(a.ceiling, targetCeiling);
          b.ceiling = Math.min(b.ceiling, targetCeiling);
          state.combinedUsedThisRoom = true;
          state.monstersSlain++;
          trackWeaponKill(a.weapon.name, Math.floor(c.value / 2));
          trackWeaponKill(b.weapon.name, Math.ceil(c.value / 2));
          removeSelected();
          log('Combined weapons (' + power + ' pwr) vs ' + c.name + '. Taken ' + damage + ' damage.', true, 'monster');
          checkGame();
          renderAfterAction();
        });
      }
    } else {
      var p = state[player];
      if (p.hp <= 0) { log(name(player) + ' is Downed.'); return; }
      var damage = c.value;
    
      if (mode === 'weapon') {
        if (!validWeapon(p, c)) { log('Monster value exceeds weapon ceiling.'); return; }
      }
    
      saveState();
    
      // Weapon kills create the monster's "memory" before the animation starts.
      // It stays out of the live dungeon until the weapon returns home, when the
      // ghost is materialised on top of the previous-monster stack.
      var ghostInfo = null;
      if (player === 'p1' && mode === 'weapon') {
        var previousMonster = JSON.parse(JSON.stringify(c));
        previousMonster._ghostId = 'ghost_' + Date.now() + '_' + Math.random().toString(36).slice(2);
        var pileIndex = p.previousMonsters.length;
        previousMonster.stackX = pileIndex === 0 ? 0 : (-0.5 * pileIndex) + (Math.random() * 3 - 1.5);
        previousMonster.stackY = pileIndex === 0 ? 0 : (-0.5 * pileIndex) + (Math.random() * 3 - 1.5);
        previousMonster.stackRotation = pileIndex === 0 ? 0 : (Math.random() * 10 - 5);
        p.previousMonsters.push(previousMonster);
    
        ghostInfo = {
          targetEl: document.getElementById('p1PreviousMonster'),
          monster: previousMonster
        };
      }
    
      animateAttack(player, targetEl, function() {
        if (mode === 'weapon') {
          damage = Math.max(0, c.value - p.weapon.value);
          p.ceiling = Math.min(p.ceiling, c.value);
          trackWeaponKill(p.weapon.name, c.value);
        } else {
          trackWeaponKill('Bare Fists', c.value);
        }
    
        p.hp = Math.max(0, p.hp - damage);
        state.monstersSlain++;
    
        if (mode === 'weapon') {
          log(name(player) + ' uses ' + p.weapon.name + ' vs ' + c.name + '. Damage taken: ' + damage + '.', true, 'monster');
        } else {
          log(name(player) + ' enters Fist Fight with ' + c.name + ' and takes ' + damage + ' damage.', true, 'fist');
        }
    
        // Fist fights clear the monster normally. Weapon kills have already
        // prepared the previous-monster memory and now just reveal it through
        // the ghost materialisation inside animateAttack().
        removeSelected();
        checkGame();
        renderAfterAction();
      }, mode !== 'weapon', ghostInfo);
    }
}

function applySharedDamage(damage, acting) {
    var a = Math.floor(damage / 2), b = Math.floor(damage / 2);
    if (damage % 2) { if (acting === 'p2') b++; else a++; }
    state.p1.hp = Math.max(0, state.p1.hp - a);
    state.p2.hp = Math.max(0, state.p2.hp - b);
}

function checkGame() {
var isSolo = state.mode !== 'coop';
var isDead = isSolo ? state.p1.hp <= 0 : (state.p1.hp <= 0 && state.p2.hp <= 0);

var totalCardsRemaining = state.deck.length + state.dungeon.length;
var isCleared = totalCardsRemaining === 0;
var allMonstersSlain = state.monstersSlain === 26;

if (isDead || isCleared || allMonstersSlain) {
  state.over = true;
  var title = "";
  var text = "";
  var score = 0;
  var scoreBanner = document.getElementById('modalScore');

  // Calculate remaining monsters
  var monsterSum = 0;
  var monstersRemainingCount = 0;
  
  var allRemaining = state.deck.concat(state.dungeon);
  for (var i = 0; i < allRemaining.length; i++) {
    var card = allRemaining[i];
    if (['spades','clubs'].indexOf(card.suit) !== -1) {
      monsterSum += card.value;
      monstersRemainingCount++;
    }
  }

  var finalConsumableScore = 0;

  for (var i = 0; i < allRemaining.length; i++) {
    var card = allRemaining[i];
  
    if (card.suit === 'hearts') {
      finalConsumableScore += card.value;
    }
  }

  // Check special case: dying on the very last card after clearing all monsters
  var isPyrrhicVictory = isDead && monstersRemainingCount === 0;

  if (isPyrrhicVictory) {
    title = "A Pyrrhic Victory!";
    score = 0;
    text = "You struck down the final beast of the dungeon, but took a mortal blow in the process. The dungeon is cleared, though none survived to tell the tale!";
    scoreBanner.className = 'score-banner';
    scoreBanner.textContent = 'SCORE: 0 (DRAW)';
  } else if (isCleared || allMonstersSlain) {
    title = 'Dungeon Complete!';
    score = (isSolo ? state.p1.hp : (state.p1.hp + state.p2.hp))
    + finalConsumableScore;
    text = 'You have defeated the dungeon!';
    scoreBanner.className = 'score-banner';
    scoreBanner.textContent = 'SCORE: +' + score;
  } else {
    title = 'You Have Fallen';
    score = -monsterSum;
    text = 'The dungeon has beaten you this time, Adventurer.';
    scoreBanner.className = 'score-banner negative';
    scoreBanner.textContent = 'SCORE: ' + score;
  }

  var modalUndoBtn = document.getElementById('modalUndoBtn');
  if (modalUndoBtn) {
    modalUndoBtn.style.display = isDead && historyStack.length > 0 ? 'block' : 'none';
  }

  // Play the result sting once, after the outcome is determined.
  if (isPyrrhicVictory || allMonstersSlain || isCleared) winGameSound();
  else loseGameSound();

  // Calculate Best Weapon
  var favWeaponName = 'Bare Fists';
  var favWeaponPts = 0;
  var wKeys = Object.keys(state.weaponUsage || {});
  for (var k = 0; k < wKeys.length; k++) {
    var wName = wKeys[k];
    var data = state.weaponUsage[wName];
    if (data.ptsSlain > favWeaponPts) {
      favWeaponName = wName;
      favWeaponPts = data.ptsSlain;
    }
  }

  var favWeaponFormatted = favWeaponName + ' (' + favWeaponPts + ' damage dealt)';

  // Populate Run Summary Stats
  document.getElementById('summarySlain').textContent = state.monstersSlain + ' / 26';
  document.getElementById('summaryRooms').textContent = state.roomsCleared + ' / 14';
  var summaryFled = document.getElementById('summaryFled');
  if (summaryFled) summaryFled.textContent = state.roomsFled || 0;
  document.getElementById('summaryFavWeapon').textContent = favWeaponFormatted;
  document.getElementById('summaryFood').textContent = state.foodConsumed + ' / ' + state.maxFoodHP + ' HP';

  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalText').innerHTML = text;
  renderRunChart();
  document.getElementById('overlay').classList.add('show');
}
}

function name(p) { 
    return p === 'p1' ? state.p1Name : state.p2Name; 
}

function hideContextActions() {
    var btn1 = document.getElementById('action1');
    var btn2 = document.getElementById('action2');
    
    btn1.classList.add('action-button-hidden');
    btn2.classList.add('action-button-hidden');
}

function setContextAction(number, label, onclick, disabled) {
    var btn = document.getElementById('action' + number);
    
    btn.textContent = label;
    btn.onclick = onclick;
    btn.disabled = !!disabled;
    btn.classList.remove('action-button-hidden');
}

function render() {
var isSolo = state.mode !== 'coop';
['p1','p2'].forEach(function(id) {
  if (isSolo && id === 'p2') return;
  var p = state[id];
  var healthbar = document.getElementById(id + 'Bar');
  var healthPath = 'HP║';
  
  for (var i = 1; i <= state.maxHP; i++) {
  
    if (i <= p.hp) {
      healthPath += '█';
    } else {
      healthPath += '░';
    }
  }

  healthPath += p.hp < 10 ? '║ ' : '║';
  healthPath += p.hp
  
  healthbar.textContent = healthPath;
  
  document.getElementById(id + 'Panel').classList.toggle('downed', p.hp === 0);
  document.getElementById(id + 'Down').innerHTML = p.hp === 0 ? '<span class="badge">DOWN</span>' : '';
  
  if (isSolo && id === 'p1') {
    var deckEl = document.getElementById('p1Deck');
    if (state.deck.length > 0) {
      var deckDepth = Math.ceil(state.deck.length / 3);
      var deckLayers = '';
      for (var layer = 0; layer <= deckDepth; layer++) {
        deckLayers += '<img src="' + THEMES[selectedTheme || 'dungeon'].artwork.back + '" alt="" style="--deck-offset:' + layer + 'px; z-index:' + (layer + 1) + ';">';
      }
      deckEl.innerHTML = '<div class="deck-card" style="--deck-depth:' + deckDepth + 'px;">' + deckLayers + '</div>';
    } else {
      deckEl.innerHTML = '';
    }

    var previousMonsterEl = document.getElementById('p1PreviousMonster');
    if (p.previousMonsters && p.previousMonsters.length) {
      var previousMonsterHtml = '<div class="previous-monster-stack">';
      for (var m = 0; m < p.previousMonsters.length; m++) {
        var monsterCard = p.previousMonsters[m];
        var ghostClass = (activeGhostMemoryId && monsterCard._ghostId === activeGhostMemoryId) ? ' ghost-memory-hidden' : '';
        previousMonsterHtml += '<div class="previous-monster-card' + ghostClass + '" style="--stack-x:' + monsterCard.stackX + 'px; --stack-y:' + monsterCard.stackY + 'px; --stack-rotation:' + monsterCard.stackRotation + 'deg; z-index:' + (m + 1) + ';">' + cardHTML(monsterCard) + '</div>';
      }
      previousMonsterHtml += '</div>';
      previousMonsterEl.innerHTML = previousMonsterHtml;
    } else {
      previousMonsterEl.innerHTML = '';
    }
  }

  if (p.weapon) {
    var displayStats = 'ATK ' + p.weapon.value + (p.ceiling === 99 ? '' : '<br><span style="font-size:0.5rem; opacity:0.85;">MAX ' + p.ceiling + '</span>');
    document.getElementById(id + 'Weapon').innerHTML = cardHTML(p.weapon); //, displayStats);
   // document.getElementById(id + 'WeaponMeta').textContent = p.weapon.name;
  } else {
    document.getElementById(id + 'Weapon').innerHTML = '';
   // document.getElementById(id + 'WeaponMeta').textContent = 'Empty';
  }
});

var d = document.getElementById('dungeon');
var slots = document.querySelectorAll('.dungeon-slot');
var boardRect = document.querySelector('.dungeon-board').getBoundingClientRect();

// Keep existing dungeon card elements alive when the same card moves to a
// different slot. This lets action renders animate the real cards instead
// of destroying and recreating them.
var existing = {};
var existingWraps = Array.prototype.slice.call(d.children);
for (var e = 0; e < existingWraps.length; e++) {
  if (existingWraps[e]._cardKey) existing[existingWraps[e]._cardKey] = existingWraps[e];
}

var used = {};
for (var i = 0; i < 4; i++) {
  (function(index) {
    var c = state.dungeon[index];
    var cardKey = c ? (c.suit + '_' + c.rank) : ('empty_' + index);
    var wrap = existing[cardKey];

    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'dungeon-card-wrap';
      wrap._cardKey = cardKey;
      if (c) {
        wrap.innerHTML = cardHTML(c);
      } else {
        wrap.innerHTML = '<div class="card empty"></div>';
      }
      d.appendChild(wrap);
    }

    // The game state owns the logical slot. The DOM wrapper only mirrors it.
    wrap._slotIndex = index;
    used[cardKey] = true;

    var slotRect = slots[index].getBoundingClientRect();
    wrap.style.left = (slotRect.left - boardRect.left) + 'px';
    wrap.style.top = (slotRect.top - boardRect.top) + 'px';
    wrap.style.width = slotRect.width + 'px';
    wrap.style.height = slotRect.height + 'px';

    var cardEl = wrap.querySelector('.card');
    if (cardEl && c) {
      cardEl.classList.toggle('selected', index === state.selected);
      cardEl.onclick = function(e) {
        if (e) e.stopPropagation();
        selectCard(index);
      };
    }
  })(i);
}

// Remove cards that are no longer present in the dungeon.
for (var r = 0; r < existingWraps.length; r++) {
  var oldWrap = existingWraps[r];
  if (oldWrap._cardKey && !used[oldWrap._cardKey]) oldWrap.remove();
}

var progress = document.getElementById('deckProgress');
var rooms = state.roomsCleared || 0;
var totalRooms = 14;

var dungeonPath = '';

for (var i = 0; i < totalRooms; i++) {

  if (i < rooms) {
    dungeonPath += '<span class="room-complete">█</span>';
  } else if (i === rooms) {
    dungeonPath += '<span class="room-current"></span>';
  } else {
    dungeonPath += '<span class="room-future">░</span>';
  }

  if (i < totalRooms - 1) {
    dungeonPath += '═';
  }
}

progress.innerHTML = dungeonPath;

var skipBtn = document.getElementById('refreshBtn');
skipBtn.textContent = state.justFled ? "Fled" : "Flee";
skipBtn.disabled = state.justFled || state.over || state.dungeon.length < 4 || state.deck.length === 0;

var undoBtn = document.getElementById('undoBtn');
undoBtn.disabled = historyStack.length === 0;

var c = state.selected === null ? null : state.dungeon[state.selected];
//var valueText = c && ['J', 'Q', 'K', 'A'].indexOf(c.rank) >= 0
//  ? ' — (' + c.value + ')'
//  : '';

//document.getElementById('selectedLabel').textContent = c ? c.name + ' (' + c.rank + SUITS[c.suit] + ')' + valueText : 'Select a card';

var monster = c && ['spades','clubs'].indexOf(c.suit) !== -1;
var weapon = c && c.suit === 'diamonds';
var potion = c && c.suit === 'hearts';

hideContextActions();

if (monster && isSolo) {

  setContextAction(
    1,
    'Weapon', function() {
    fight('p1','weapon');
    },
    !validWeapon(state.p1, c)
  );

  setContextAction(
    2,
    'Fist Fight', function() {
      fight('p1','bare');
    }
  );

} else if (weapon && isSolo) {

  setContextAction(1, 'Equip', function() {
    equipWeapon('p1');
  });

  setContextAction(2, 'Discard', function() {
    discardDungeonWeapon();
  });

} else if (potion && isSolo) {

    setContextAction(
      1,
      'Consume',
      function() {
        drinkDirectPotion('p1');
      },
      state.p1.consumedThisRoom
    );

    setContextAction(
      2,
      'Discard',
      function() {
        discardDungeonPotion();
      },
      false
    );
  } 
}  

      //weaponGrid.innerHTML = 
      //'<button type="button" onclick="equipWeapon(\'p1\')"' + (state.p1.hp === 0 ? ' disabled' : '') + '>' + state.p1Name + ' Equip</button>' +
      //'<button type="button" onclick="equipWeapon(\'p2\')"' + (state.p2.hp === 0 ? ' disabled' : '') + '>' + state.p2Name + ' Equip</button>' +
      //'<button type="button" onclick="discardDungeonWeapon()" style="grid-column:1/-1">Discard Weapon</button>';
  
    //fightGrid.innerHTML = 
    //  '<button type="button" onclick="fight(\'p1\',\'weapon\')" id="p1WeaponFight" style="grid-column:1">' + state.p1Name + ' Weapon</button>' +
    //  '<button type="button" onclick="fight(\'p2\',\'weapon\')" id="p2WeaponFight" style="grid-column:2">' + state.p2Name + ' Weapon</button>' +
    //  '<button type="button" onclick="fight(\'p1\',\'bare\')" id="p1BareFight" style="grid-column:1">' + state.p1Name + ' Fist Fight</button>' +
    //  '<button type="button" onclick="fight(\'p2\',\'bare\')" id="p2BareFight" style="grid-column:2">' + state.p2Name + ' Fist Fight</button>' +
    //  '<button type="button" onclick="fight(\'both\',\'combined\')" id="combinedFight" style="grid-column:1/-1">⚔️ Both Combine Weapons</button>' +
    //  '<button type="button" onclick="fight(\'both\',\'combined_bare\')" id="combinedBareFight" style="grid-column:1/-1">👊 Both 2v1 Fist Fight</button>';
    //document.getElementById('p1WeaponFight').disabled = !validWeapon(state.p1, c) || state.p1.hp === 0;
    //document.getElementById('p2WeaponFight').disabled = !validWeapon(state.p2, c) || state.p2.hp === 0;
    //document.getElementById('p1BareFight').disabled = state.p1.hp === 0;
    //document.getElementById('p2BareFight').disabled = state.p2.hp === 0;
    
    //var okCombinedWeapon = state.p1.weapon && state.p2.weapon && state.p1.ceiling !== null && state.p2.ceiling !== null && state.p1.hp > 0 && state.p2.hp > 0 && (c.value) <= (state.p1.ceiling + state.p2.ceiling) && !state.combinedUsedThisRoom;
    //document.getElementById('combinedFight').disabled = !okCombinedWeapon;

    //var okCombinedBare = state.p1.hp > 0 && state.p2.hp > 0 && !state.combinedUsedThisRoom;
    //document.getElementById('combinedBareFight').disabled = !okCombinedBare;


function log(text, recordEvent, eventType, weaponStrengths) {
    var box = document.getElementById('log');
    if (box) box.innerHTML = '<div class="logline">• ' + text + '</div>' + box.innerHTML;
    
    // Keep a compact structured history alongside the visible text log.
    // The graph uses event order as the run's X-axis because the game has no
    // real-world clock/timestamp associated with individual actions.
    if (recordEvent !== false && state && state.p1 && Array.isArray(state.eventHistory)) {
      state.eventHistory.push({
        text: String(text),
        type: (arguments.length >= 3 && arguments[2]) ? arguments[2] : 'other',
        p1hp: state.p1.hp,
        p2hp: state.p2 ? state.p2.hp : null,
        p1Ceiling: state.p1.ceiling,
        p2Ceiling: state.p2 ? state.p2.ceiling : null,
        p1WeaponStrength: (arguments.length >= 4 && arguments[3]) ? arguments[3].p1 : null,
        p2WeaponStrength: (arguments.length >= 4 && arguments[3]) ? arguments[3].p2 : null,
        monstersSlain: state.monstersSlain || 0,
        roomsCleared: state.roomsCleared || 0
      });
    }
}

function xmlEscape(text) {
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function renderRunChart() {
    var target = document.getElementById('runChart');
    var legend = document.getElementById('runChartLegend');
    if (!target) return;
    
    var events = Array.isArray(state.eventHistory) ? state.eventHistory : [];
    if (!events.length) {
      target.innerHTML = '<div style="padding:10px;color:var(--muted);font-size:0.75rem;">No run history recorded.</div>';
      if (legend) legend.innerHTML = '';
      return;
    }
    
    var isSolo = state.mode !== 'coop';
    var W = 720, H = 300;
    var left = 54, right = 12, top = 22, bottom = 252;
    var plotW = W - left - right;
    var hpH = bottom - top;
    var maxHP = state.maxHP || 20;
    var n = events.length;
    var x = function(i) { return left + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW); };
    var hpY = function(v) { return bottom - (Math.max(0, Math.min(maxHP, v)) / maxHP) * hpH; };
    
    var parts = [];
    parts.push('<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Run log">');
    parts.push('<line class="grid-line" x1="' + left + '" y1="' + hpY(maxHP) + '" x2="' + (W-right) + '" y2="' + hpY(maxHP) + '"/>');
    //parts.push('<line class="grid-line" x1="' + left + '" y1="' + hpY(maxHP/2) + '" x2="' + (W-right) + '" y2="' + hpY(maxHP/2) + '"/>');
    parts.push('<line class="grid-line" x1="' + left + '" y1="' + hpY(0) + '" x2="' + (W-right) + '" y2="' + hpY(0) + '"/>');
    parts.push('<line class="axis-line" x1="' + left + '" y1="' + top + '" x2="' + left + '" y2="' + bottom + '"/>');
    parts.push('<line class="axis-line" x1="' + left + '" y1="' + bottom + '" x2="' + (W-right) + '" y2="' + bottom + '"/>');
    //parts.push('<text class="panel-label" x="' + left + '" y="13">Health</text>');
    parts.push('<text class="axis-label" text-anchor="end" x="' + (left-7) + '" y="' + (hpY(maxHP)+4) + '">' + maxHP + '</text>');
    //parts.push('<text class="axis-label" text-anchor="end" x="' + (left-7) + '" y="' + (hpY(maxHP/2)+4) + '">' + Math.round(maxHP/2) + '</text>');
    parts.push('<text class="axis-label" text-anchor="end" x="' + (left-7) + '" y="' + (hpY(0)+4) + '">0</text>');
    
    var p1HpPoints = events.map(function(e,i){ return x(i)+','+hpY(e.p1hp); }).join(' ');
    parts.push('<polyline class="hp-line" points="' + p1HpPoints + '"/>');
    if (!isSolo) {
      var p2HpPoints = events.map(function(e,i){ return x(i)+','+hpY(e.p2hp == null ? 0 : e.p2hp); }).join(' ');
      parts.push('<polyline class="hp-line p2" points="' + p2HpPoints + '"/>');
    }
    
    events.forEach(function(e,i){
      var cls = ['weapon','monster','fist','potion','flee'].indexOf(e.type) >= 0 ? e.type : 'other';
      var py = hpY(e.p1hp);
      var title = 'Event ' + (i+1) + ': ' + e.text;
      parts.push('<circle class="event-dot ' + cls + '" cx="' + x(i) + '" cy="' + py + '" r="6"><title>' + xmlEscape(title) + '</title></circle>');
      if (!isSolo && e.p2hp != null) {
        parts.push('<circle class="event-dot ' + cls + ' alt" cx="' + x(i) + '" cy="' + hpY(e.p2hp) + '" r="3.7"><title>' + xmlEscape(title) + '</title></circle>');
      }
    });
    
    var ticks = n === 1 ? [0] : [0, Math.floor((n-1)/2), n-1];
    var used = {};
    ticks.forEach(function(i){
      if (used[i]) return; used[i]=true;
      parts.push('<line class="axis-line" x1="' + x(i) + '" y1="' + bottom + '" x2="' + x(i) + '" y2="' + (bottom+4) + '"/>');
      parts.push('<text class="axis-label" text-anchor="middle" x="' + x(i) + '" y="' + (bottom+17) + '">' + (i+1) + '</text>');
    });
    //parts.push('<text class="axis-label" text-anchor="middle" x="' + (W/2) + '" y="' + (H-5) + '">Event order</text>');
    parts.push('</svg>');
    target.innerHTML = parts.join('');
    
    if (legend) {
      var legendHtml = '';
      legendHtml += '<span class="run-chart-legend-item"><span class="run-chart-legend-line"></span>' + xmlEscape(state.p1Name || 'Player 1') + '</span>';
      if (!isSolo) legendHtml += '<span class="run-chart-legend-item"><span class="run-chart-legend-line p2"></span>' + xmlEscape(state.p2Name || 'Player 2') + '</span>';
      legendHtml += '<span class="run-chart-legend-item"><span class="run-chart-legend-dot monster"></span>Weapon fight</span>';
      legendHtml += '<span class="run-chart-legend-item"><span class="run-chart-legend-dot fist"></span>Fist fight</span>';
      legendHtml += '<span class="run-chart-legend-item"><span class="run-chart-legend-dot weapon"></span>Weapon equipped</span>';
      legendHtml += '<span class="run-chart-legend-item"><span class="run-chart-legend-dot potion"></span>HP restored</span>';
      legendHtml += '<span class="run-chart-legend-item"><span class="run-chart-legend-dot flee"></span>Room fled</span>';
      legend.innerHTML = legendHtml;
    }
}

// Peek Event Handlers (Keyboard + Touch/Mouse)
function setupPeekHandlers() {
    var overlay = document.getElementById('overlay');
    var peekBtn = document.getElementById('peekBtn');
    
    var setPeek = function(isPeeking) {
      if (isPeeking) {
        overlay.classList.add('peek-hidden');
      } else {
        overlay.classList.remove('peek-hidden');
      }
    };
    
    // Keyboard handlers [V]
    window.addEventListener('keydown', function(e) {
      if (e.key === 'v' || e.key === 'V') setPeek(true);
    });
    window.addEventListener('keyup', function(e) {
      if (e.key === 'v' || e.key === 'V') setPeek(false);
    });
    
    // Touch & Mouse events for peek button
    peekBtn.addEventListener('mousedown', function() { setPeek(true); });
    peekBtn.addEventListener('mouseup', function() { setPeek(false); });
    peekBtn.addEventListener('touchstart', function(e) { e.preventDefault(); setPeek(true); });
    peekBtn.addEventListener('touchend', function(e) { e.preventDefault(); setPeek(false); });
}

// Initial load execution
window.onload = function() {
    toggleModeInputs();
    setupPeekHandlers();
    
    var splash = document.getElementById('splashScreen');
    var app = document.querySelector('.container');
    var splashStarted = false;
    
    function beginFromSplash() {
      if (splashStarted) return;
      splashStarted = true;
    
      // This click is the browser-approved user gesture that unlocks Web Audio.
      getAudioContext();
      deckDungeonTheme();
    
      app.classList.remove('splash-hidden');
      splash.classList.add('fade-out');
      setTimeout(function() { splash.remove(); }, 500);
    }
    
    splash.addEventListener('click', beginFromSplash);
    splash.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); beginFromSplash(); }
    });
};
