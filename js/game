<script>
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
    p1: { hp: maxHP, weapon: starterWeaponP1, ceiling: starterCeilingP1, consumedThisRoom: false },
    p2: { hp: maxHP, weapon: starterWeaponP2, ceiling: starterCeilingP2, consumedThisRoom: false },
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
function fight(player, mode) {
    if (state.over || state.selected === null) return;
    var c = state.dungeon[state.selected];
    if (['spades','clubs'].indexOf(c.suit) === -1) return;

    var targetEl = document.querySelector('#dungeon .dungeon-card-wrap:nth-child(' + (state.selected + 1) + ') .card');

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
        removeSelected();
        checkGame();
        renderAfterAction();
      }, mode !== 'weapon');
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
