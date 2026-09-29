/*
 * Deck Dungeon — Animation System (parallel rewrite)
 *
 * This file is intentionally NOT loaded by index.html yet.
 * It is a clean-room replacement for the animation code currently living
 * in game.js. Existing gameplay is therefore completely unaffected.
 *
 * Design principles:
 *   1. Every animation has its own focused function.
 *   2. No isFistFight / isWeaponFight branching inside choreography.
 *   3. All geometry is converted into the 667 × 1000 game-canvas coordinate
 *      system in exactly one place.
 *   4. Animation functions know about DOM elements, not game rules/state.
 *   5. Shared helpers provide mechanics only; they do not decide choreography.
 *   6. Callbacks fire once, after the visual animation has completed.
 *
 * Planned public API:
 *   DeckDungeonAnimations.equip(...)
 *   DeckDungeonAnimations.eat(...)
 *   DeckDungeonAnimations.discard(...)
 *   DeckDungeonAnimations.flee(...)
 *   DeckDungeonAnimations.monsterToPrevious(...)
 *   DeckDungeonAnimations.fistFight(...)
 *   DeckDungeonAnimations.use(...)
 *   DeckDungeonAnimations.deal(...)
 *   DeckDungeonAnimations.slideDungeonCards(...)
 *   DeckDungeonAnimations.weaponFightMelee(...)
 *   DeckDungeonAnimations.weaponFightThrown(...)
 *   DeckDungeonAnimations.weaponFightRanged(...)
 *
 * The implementation below is deliberately self-contained so each animation
 * can be migrated and tested independently.
 */

(function (global) {
  'use strict';

  var WIDTH = 667;
  var HEIGHT = 1000;

  function getCanvas() {
    return document.querySelector('.game-canvas');
  }

  /*
   * Convert any element's browser rectangle into game-canvas coordinates.
   * This is the ONLY coordinate conversion used by this module.
   */
  function rect(element) {
    var canvas = getCanvas();
    if (!canvas || !element) return null;

    var canvasRect = canvas.getBoundingClientRect();
    var scale = canvasRect.width / WIDTH;
    if (!scale) scale = 1;

    var r = element.getBoundingClientRect();

    return {
      left: (r.left - canvasRect.left) / scale,
      top: (r.top - canvasRect.top) / scale,
      width: r.width / scale,
      height: r.height / scale,
      right: (r.right - canvasRect.left) / scale,
      bottom: (r.bottom - canvasRect.top) / scale,
      centerX: (r.left - canvasRect.left + r.width / 2) / scale,
      centerY: (r.top - canvasRect.top + r.height / 2) / scale
    };
  }

  function center(r) {
    return {
      x: r.left + r.width / 2,
      y: r.top + r.height / 2
    };
  }

  function translation(from, to) {
    var a = center(from);
    var b = center(to);

    return {
      x: b.x - a.x,
      y: b.y - a.y
    };
  }

  function appendClone(source, className, sourceRect) {
    var canvas = getCanvas();
    if (!canvas || !source || !sourceRect) return null;

    var clone = source.cloneNode(true);
    clone.classList.add('dd-animation-clone');

    if (className) {
      className.split(/\s+/).forEach(function (name) {
        if (name) clone.classList.add(name);
      });
    }

    clone.style.left = sourceRect.left + 'px';
    clone.style.top = sourceRect.top + 'px';
    clone.style.width = sourceRect.width + 'px';
    clone.style.height = sourceRect.height + 'px';

    canvas.appendChild(clone);
    return clone;
  }

  function hide(element, className) {
    if (element) element.classList.add(className || 'dd-animation-hidden');
  }

  function show(element, className) {
    if (element) element.classList.remove(className || 'dd-animation-hidden');
  }

  function removeLater(element, delay, callback) {
    window.setTimeout(function () {
      if (element && element.parentNode) element.parentNode.removeChild(element);
      if (callback) callback();
    }, delay);
  }

  function once(callback) {
    var called = false;

    return function () {
      if (called) return;
      called = true;
      if (callback) callback();
    };
  }

  function impact(type, position, duration) {
    var canvas = getCanvas();
    if (!canvas || !position) return null;

    var el = document.createElement('div');
    el.className = 'dd-animation-impact dd-animation-impact-' + type;
    el.style.left = position.x + 'px';
    el.style.top = position.y + 'px';

    if (type === 'heart') el.textContent = '♥';
    if (type === 'hit') el.textContent = '💥';
    if (type === 'weapon') el.textContent = '⚔';

    canvas.appendChild(el);
    removeLater(el, duration || 280);
    return el;
  }

  function shake(duration) {
    var game = document.getElementById('game');
    if (!game) return;

    game.classList.remove('combat-shake');
    void game.offsetWidth;
    game.classList.add('combat-shake');

    window.setTimeout(function () {
      game.classList.remove('combat-shake');
    }, duration || 160);
  }

  function setVector(element, property, x, y) {
    element.style.setProperty('--' + property + '-x', x + 'px');
    element.style.setProperty('--' + property + '-y', y + 'px');
  }

  /*
   * Generic one-source-to-one-target movement.
   *
   * This is intentionally small. It does not decide whether something is
   * being equipped, eaten, discarded, or fought.
   */
  function moveCard(source, target, options) {
    options = options || {};

    var finish = once(options.done);
    var sourceRect = rect(source);
    var targetRect = rect(target);

    if (!sourceRect || !targetRect) {
      finish();
      return;
    }

    var clone = appendClone(
      source,
      options.className || 'dd-animation-move',
      sourceRect
    );

    if (!clone) {
      finish();
      return;
    }

    var move = translation(sourceRect, targetRect);

    setVector(clone, 'move', move.x, move.y);

    if (options.hideSource !== false) hide(source);

    clone.style.setProperty('--animation-duration',
      (options.duration || 500) + 'ms');

    /*
     * The concrete CSS animation is deliberately named by the caller.
     * This helper only establishes geometry and lifecycle.
     */
    clone.classList.add(options.animationClass || 'dd-animation-move-active');

    removeLater(clone, options.duration || 500, function () {
      if (options.hideSource !== false) show(source);
      finish();
    });
  }


  /*
   * LIFT → TRAVEL → SLAM
   *
   * The only tabletop "height" choreography in the animation system.
   * Equip and use both use this same physical card motion:
   *
   *   1. Lift off the table and grow slightly.
   *   2. Travel while elevated.
   *   3. Slam down onto the destination.
   *   4. Settle at normal scale.
   *
   * The helper knows nothing about what the card means or why it is moving.
   * The public equip()/use() functions provide the destination.
   */
  function liftTravelSlam(card, target, options) {
    options = options || {};

    var finish = once(options.done);
    var sourceRect = rect(card);
    var targetRect = rect(target);

    if (!sourceRect || !targetRect) {
      finish();
      return;
    }

    var clone = appendClone(
      card,
      options.className || 'dd-lift-travel-slam-clone',
      sourceRect
    );

    if (!clone) {
      finish();
      return;
    }

    var move = translation(sourceRect, targetRect);

    setVector(clone, 'move', move.x, move.y);

    /*
     * These are choreography values rather than geometry. CSS owns the
     * actual visual treatment of height, scale and slam.
     */
    clone.style.setProperty('--lift-scale', options.liftScale || '1.08');
    clone.style.setProperty(
      '--animation-duration',
      (options.duration || 650) + 'ms'
    );

    hide(card);
    clone.classList.add(options.animationClass || 'dd-lift-travel-slam-active');

    // Preserve the established equip sound timing: it starts during the lift
    // and its metallic tail carries through the slam/settle.
    if (options.sound) {
      window.setTimeout(function () {
        options.sound();
      }, options.soundTime || 100);
    }

    window.setTimeout(function () {
      impact(options.impactType || 'weapon', center(targetRect), 320);
      shake(170);
    }, options.impactTime || 403);

    removeLater(clone, options.duration || 650, function () {
      show(card);
      finish();
    });
  }

  /*
   * EQUIP
   *
   * Simple card movement with a physical landing point.
   * No combat knowledge.
   */
  function equip(card, target, options) {
    options = options || {};
    options.className = options.className || 'dd-equip-clone';
    options.animationClass = options.animationClass || 'dd-equip-active';
    options.impactType = options.impactType || 'weapon';
    options.duration = options.duration || 650;
    options.impactTime = options.impactTime || 403;
    options.sound = options.sound || (
      typeof global.weaponEquipSound === 'function'
        ? global.weaponEquipSound
        : null
    );
    options.soundTime = options.soundTime || 100;

    liftTravelSlam(card, target, options);
  }

  /*
   * EAT
   *
   * Deliberately its own animation.
   *
   * Phase 1: food travels to the player.
   * Phase 2: top third is eaten.
   * Phase 3: remaining two thirds move upward by one third.
   * Phase 4: middle third is eaten.
   * Phase 5: remaining third moves upward by one third.
   * Phase 6: final third is eaten.
   * Phase 7: heart impact confirms the completed feeding action.
   */
  function eat(food, player, options) {
    options = options || {};

    var finish = once(options.done);
    var foodRect = rect(food);
    var playerRect = rect(player);

    if (!foodRect || !playerRect) {
      finish();
      return;
    }

    var clone = appendClone(food, 'dd-eat-clone', foodRect);
    if (!clone) {
      finish();
      return;
    }

    // Anchor the FOOD TOP EDGE to the middle of the player card,
    // aligning the card with the player's portrait area.
    var target = {
      left: playerRect.left,
      top: playerRect.top + playerRect.height / 2,
      width: foodRect.width,
      height: foodRect.height
    };

    target.centerX = target.left + target.width / 2;
    target.centerY = target.top + target.height / 2;

    var start = center(foodRect);
    var dx = target.centerX - start.x;
    var dy = target.centerY - start.y;

    setVector(clone, 'move', dx, dy);
    clone.style.setProperty('--card-third', (foodRect.height / 3) + 'px');
    clone.style.setProperty('--card-two-thirds', (foodRect.height * 2 / 3) + 'px');
    clone.style.setProperty('--animation-duration', '770ms');

    hide(food);
    clone.classList.add('dd-eat-active');

    if (options.sound) {
      options.sound();
    }

    window.setTimeout(function () {
      impact('heart', center(playerRect), 280);
    }, 500);

    removeLater(clone, 770, function () {
      show(food);
      finish();
    });
  }

  /*
   * USE
   *
   * Consumables which are used rather than eaten (armour, equipment, etc.).
   * Mechanically similar to equip(), but the destination is the player card.
   */
  function use(card, player, options) {
    options = options || {};
    options.className = options.className || 'dd-use-clone';
    options.animationClass = options.animationClass || 'dd-use-active';
    options.impactType = options.impactType || 'heart';
    options.duration = options.duration || 650;
    options.impactTime = options.impactTime || 403;

    liftTravelSlam(card, player, options);
  }

  /*
   * DRINK
   *
   * A consumable drink travels to the player, gradually tips as if being
   * finished, then disappears once the glass/bottle has been emptied.
   */
  function drink(card, player, options) {
    options = options || {};

    var finish = once(options.done);
    var cardRect = rect(card);
    var playerRect = rect(player);

    if (!cardRect || !playerRect) {
      finish();
      return;
    }

    var clone = appendClone(card, 'dd-drink-clone', cardRect);
    if (!clone) {
      finish();
      return;
    }

    // Anchor the CARD TOP EDGE to the middle of the player card.
    // The drink choreography pivots around that top edge, so the portrait
    // and card top remain together while the bottom tips away.
    var target = {
      x: playerRect.left + playerRect.width / 2,
      y: playerRect.top + playerRect.height / 2
    };
    var startTopCenter = {
      x: cardRect.left + cardRect.width / 2,
      y: cardRect.top
    };

    setVector(
      clone,
      'move',
      target.x - startTopCenter.x,
      target.y - startTopCenter.y
    );
    clone.style.setProperty('--animation-duration', (options.duration || 900) + 'ms');

    hide(card);
    clone.classList.add('dd-drink-active');

    window.setTimeout(function () {
      impact('heart', target, 280);
    }, options.impactTime || 700);

    removeLater(clone, options.duration || 900, function () {
      show(card);
      finish();
    });
  }

  /*
   * DEAL
   *
   * The visual inverse of flee: cards originate at the deck and travel out
   * into the dungeon slots. The game decides which cards are dealt.
   */
  function deal(cards, deck, slots, options) {
    options = options || {};

    var list = Array.isArray(cards) ? cards : [cards];
    var targets = Array.isArray(slots) ? slots : [slots];
    var valid = list.filter(Boolean);

    if (!valid.length || !deck || !targets.length) {
      if (options.done) options.done();
      return;
    }

    var deckRect = rect(deck);
    if (!deckRect) {
      if (options.done) options.done();
      return;
    }

    var complete = once(options.done);
    var pending = 0;
    var delay = options.delay == null ? 110 : options.delay;
    var duration = options.duration || 650;
    var startOffsetX = options.startOffsetX || 0;
    var startOffsetY = options.startOffsetY || 0;

    if (options.sound) {
      options.sound(valid.length);
    }

    valid.forEach(function (card, index) {
      var target = targets[index];
      var targetRect = rect(target);
      if (!targetRect) return;

      pending += 1;

      var clone = appendClone(card, 'dd-deal-clone', deckRect);
      if (!clone) {
        pending -= 1;
        return;
      }

      clone.style.left = (deckRect.left + startOffsetX) + 'px';
      clone.style.top = (deckRect.top + startOffsetY) + 'px';

      var move = {
        x: targetRect.centerX - (deckRect.centerX + startOffsetX),
        y: targetRect.centerY - (deckRect.centerY + startOffsetY)
      };

      setVector(clone, 'move', move.x, move.y);
      clone.style.setProperty('--animation-delay', (index * delay) + 'ms');
      clone.style.setProperty('--animation-duration', duration + 'ms');
      clone.dataset.dealCardIndex = index;
      clone.classList.add('dd-deal-active');

      hide(card);

      removeLater(clone, duration + index * delay, function () {
        show(card);
        pending -= 1;
        if (pending === 0) complete();
      });
    });

    if (pending === 0) complete();
  }

  /*
   * SLIDE DUNGEON CARDS
   *
   * [A][B][C][D], remove B -> [A][C][D][ ]
   * Every card after the removed slot moves one position towards the front.
   */
  function slideDungeonCards(cards, slots, removedIndex, options) {
    options = options || {};

    var list = Array.isArray(cards) ? cards : [];
    var targets = Array.isArray(slots) ? slots : [];

    if (removedIndex == null || removedIndex < 0 || removedIndex >= list.length) {
      if (options.done) options.done();
      return;
    }

    var finish = once(options.done);
    var duration = options.duration || 420;
    var pending = 0;

    for (var i = removedIndex + 1; i < list.length; i += 1) {
      var card = list[i];
      var target = targets[i - 1];

      if (!card || !target) continue;

      var sourceRect = rect(card);
      var targetRect = rect(target);
      if (!sourceRect || !targetRect) continue;

      pending += 1;

      var clone = appendClone(card, 'dd-dungeon-slide-clone', sourceRect);
      if (!clone) {
        pending -= 1;
        continue;
      }

      setVector(clone, 'move',
        targetRect.centerX - sourceRect.centerX,
        targetRect.centerY - sourceRect.centerY
      );
      clone.style.setProperty('--animation-duration', duration + 'ms');

      hide(card);
      clone.classList.add('dd-dungeon-slide-active');

      removeLater(clone, duration, function () {
        show(card);
        pending -= 1;
        if (pending === 0) finish();
      });
    }

    if (pending === 0) finish();
  }

  /*
   * DISCARD
   * 
   * Card topples sideways, then "falls" off the bottom of the screen,
   * akin to falling off a cliff.
   */
  /*
   * DISCARD
   *
   * Existing tabletop choreography:
   *   1. Card starts upright.
   *   2. It gives a small sideways topple.
   *   3. It rapidly falls off the bottom of the table/screen.
   *   4. It rotates further, shrinks slightly, and fades away.
   *
   * This is deliberately not a generic source → target movement. The discard
   * destination is effectively "off the table", so the choreography owns the
   * final direction and fall distance.
   */
  function discard(card, target, options) {
    options = options || {};

    var finish = once(options.done);
    var sourceRect = rect(card);

    if (!sourceRect) {
      finish();
      return;
    }

    var clone = appendClone(card, 'dd-discard-clone', sourceRect);
    if (!clone) {
      finish();
      return;
    }

    /*
     * Preserve the established feel from the live animation:
     * 22° topple, then a fast fall roughly one viewport-height downward.
     *
     * The target argument is intentionally unused: discard is an "off table"
     * choreography rather than a move to another card.
     */
    setVector(clone, 'fall', 30, sourceRect.height * 6.2);
    clone.style.setProperty('--animation-duration', '560ms');
    clone.style.setProperty('--topple-x', '8px');
    clone.style.setProperty('--topple-y', '18px');

    hide(card);
    clone.classList.add('dd-discard-active');

    // Preserve the existing discard sound in the migrated choreography.
    if (typeof global.discardSound === 'function') {
      global.discardSound();
    }

    removeLater(clone, 560, function () {
      show(card);
      finish();
    });
  }

  /*
   * FLEE
   *
   * Flee is kept separate because its destination is the deck and its visual
   * intent is "return to deck", rather than generic discard.
   */
  function flee(cards, deck, options) {
    options = options || {};

    var list = Array.isArray(cards) ? cards : [cards];
    var remaining = list.filter(Boolean);

    if (!remaining.length || !deck) {
      if (options.done) options.done();
      return;
    }

    var complete = once(options.done);
    var finished = 0;

    if (options.sound) {
      options.sound();
    }

    remaining.forEach(function (card, index) {
      var sourceRect = rect(card);
      var deckRect = rect(deck);

      if (!sourceRect || !deckRect) {
        finished += 1;
        return;
      }

      var clone = appendClone(card, 'dd-flee-clone', sourceRect);
      if (!clone) {
        finished += 1;
        return;
      }

      var move = translation(sourceRect, deckRect);
      setVector(clone, 'move', move.x, move.y);
      clone.style.setProperty('--animation-delay', (index * 80) + 'ms');
      clone.style.setProperty('--animation-duration', '650ms');

      // Fleeing cards disappear into the deck rather than sitting above it.
      clone.style.zIndex = '999';

      hide(card);
      clone.classList.add('dd-flee-active');

      removeLater(clone, 650 + index * 80, function () {
        show(card);
        finished += 1;
        if (finished === remaining.length) complete();
      });
    });
  }

  /*
   * MONSTER → PREVIOUS MONSTER STACK
   */
  function monsterToPrevious(monsterCard, previousStack, stack, options) {
    options = options || {};

    var finish = once(options.done);
    var sourceRect = rect(monsterCard);
    var targetRect = rect(previousStack);

    if (!sourceRect || !targetRect) {
      finish();
      return;
    }

    var clone = appendClone(monsterCard, 'dd-monster-stack-clone', sourceRect);
    if (!clone) {
      finish();
      return;
    }

    var targetX = targetRect.centerX + ((stack && stack.x) || 0);
    var targetY = targetRect.centerY + ((stack && stack.y) || 0);
    var source = center(sourceRect);

    setVector(clone, 'move', targetX - source.x, targetY - source.y);
    clone.style.setProperty('--stack-rotation', ((stack && stack.rotation) || 0) + 'deg');
    clone.style.setProperty('--animation-duration', '520ms');

    hide(monsterCard);
    clone.classList.add('dd-monster-stack-active');

    removeLater(clone, 520, function () {
      show(monsterCard);
      finish();
    });
  }

  /*
   * FIST FIGHT
   *
   * Completely independent choreography.
   * The monster is the attacking object.
   *
   * 1. Monster moves to player.
   * 2. First punch.
   * 3. Second punch.
   * 4. Monster dies in place.
   */
  function fistFight(monster, player, options) {
    options = options || {};

    var finish = once(options.done);
    var monsterRect = rect(monster);
    var playerRect = rect(player);

    if (!monsterRect || !playerRect) {
      finish();
      return;
    }

    var clone = appendClone(monster, 'dd-fist-monster-clone', monsterRect);
    if (!clone) {
      finish();
      return;
    }

    var move = translation(monsterRect, playerRect);
    setVector(clone, 'move', move.x, move.y);
    setVector(clone, 'hit', -5, 3);
    clone.style.setProperty('--animation-duration', '1000ms');

    hide(monster);
    clone.classList.add('dd-fist-fight-active');

    if (options.sound) {
      window.setTimeout(function () {
        options.sound();
      }, 320);

      window.setTimeout(function () {
        options.sound();
      }, 540);
    }

    window.setTimeout(function () {
      impact('hit', center(playerRect), 280);
      shake(160);
    }, 320);

    window.setTimeout(function () {
      impact('hit', center(playerRect), 280);
      shake(160);
    }, 540);

    removeLater(clone, 1000, function () {
      /*
       * Deliberately leave the real monster hidden here. The caller owns
       * the game-state transition and decides when the board is re-rendered.
       */
      finish();
    });
  }


  /*
   * WEAPON FIGHT — MELEE
   *
   * Weapon joins the player, player + weapon approach the monster, player
   * stops short, weapon strikes alone, then both return independently.
   */
  function weaponFightMelee(weapon, player, monster, options) {
    options = options || {};

    var finish = once(options.done);
    var weaponRect = rect(weapon);
    var playerRect = rect(player);
    var monsterRect = rect(monster);

    if (!weaponRect || !playerRect || !monsterRect) {
      finish();
      return;
    }

    /*
     * MELEE — STEP 1 + STEP 2
     *
     * Step 1:
     *   Weapon moves to the player's right-hand position. The weapon's left
     *   edge meets the player's centre line, so it covers the right half.
     *
     * Step 2:
     *   Player and weapon travel together toward the monster and stop short.
     *   The weapon remains locked to the same hand position throughout.
     *
     * No strike is performed yet.
     */
    var weaponClone = appendClone(weapon, 'dd-melee-join-clone', weaponRect);
    var playerClone = appendClone(player, 'dd-melee-player-clone', playerRect);

    if (!weaponClone || !playerClone) {
      if (weaponClone) weaponClone.remove();
      if (playerClone) playerClone.remove();
      finish();
      return;
    }

    var weaponStart = center(weaponRect);
    var playerStart = center(playerRect);
    var monsterCenter = center(monsterRect);

    var hand = {
      left: playerRect.left + playerRect.width / 2,
      top: playerRect.top + playerRect.height / 2 - weaponRect.height / 2
    };

    var joinX = hand.left - weaponRect.left;
    var joinY = hand.top - weaponRect.top;

    setVector(weaponClone, 'join', joinX, joinY);

    /*
     * Work out a stopping point from the monster's centre, rather than using
     * a hard-coded screen coordinate. This keeps the approach proportional
     * if the board is resized.
     */
    var vx = monsterCenter.x - playerStart.x;
    var vy = monsterCenter.y - playerStart.y;
    var distance = Math.sqrt(vx * vx + vy * vy) || 1;

    var stopDistance = options.stopDistance ||
      Math.max(playerRect.width, monsterRect.width) * 0.65;

    var stopCenter = {
      x: monsterCenter.x - (vx / distance) * stopDistance,
      y: monsterCenter.y - (vy / distance) * stopDistance
    };

    var approachX = stopCenter.x - playerStart.x;
    var approachY = stopCenter.y - playerStart.y;

    setVector(playerClone, 'approach', approachX, approachY);

    /*
     * Stage 2 must be a literal shared translation.
     * The weapon is first moved to the hand, then its DOM position is
     * rebased there. From that point onward BOTH clones receive exactly
     * the same translate3d(approachX, approachY) movement.
     */
    weaponClone.style.setProperty('--animation-duration', '500ms');
    playerClone.style.setProperty('--animation-duration', '500ms');

    hide(weapon);
    hide(player);

    weaponClone.classList.add('dd-melee-step2-weapon-active');

    window.setTimeout(function () {
      /*
       * Rebase the weapon at the exact hand position before Stage 2.
       * This removes the join offset from its transform completely.
       */
      weaponClone.classList.remove('dd-melee-step2-weapon-active');
      weaponClone.style.left = hand.left + 'px';
      weaponClone.style.top = hand.top + 'px';
      weaponClone.style.transform = 'none';

      playerClone.classList.add('dd-melee-step2-player-active');
      weaponClone.classList.add('dd-melee-step2-shared-move-active');

      removeLater(weaponClone, 500, function () {
        if (weaponClone.parentNode) weaponClone.remove();
        show(weapon);
      });

      removeLater(playerClone, 500, function () {
        if (playerClone.parentNode) playerClone.remove();
        show(player);
        finish();
      });
    }, 500);
  }

  /*
   * WEAPON FIGHT — THROWN
   *
   * Weapon moves to player, launches to monster, then returns to its own slot.
   */
  function weaponFightThrown(weapon, player, monster, options) {
    options = options || {};

    var finish = once(options.done);
    var weaponRect = rect(weapon);
    var playerRect = rect(player);
    var monsterRect = rect(monster);

    if (!weaponRect || !playerRect || !monsterRect) {
      finish();
      return;
    }

    var clone = appendClone(weapon, 'dd-thrown-weapon-clone', weaponRect);
    if (!clone) {
      finish();
      return;
    }

    var weaponStart = center(weaponRect);
    var playerCenter = center(playerRect);
    var monsterCenter = center(monsterRect);

    var hand = {
      x: playerCenter.x + (options.handOffsetX || 0),
      y: playerCenter.y + (options.handOffsetY || 0)
    };

    setVector(clone, 'join',
      hand.x - weaponStart.x,
      hand.y - weaponStart.y
    );
    setVector(clone, 'throw',
      monsterCenter.x - hand.x,
      monsterCenter.y - hand.y
    );
    setVector(clone, 'return',
      weaponStart.x - monsterCenter.x,
      weaponStart.y - monsterCenter.y
    );

    clone.style.setProperty('--animation-duration', (options.duration || 1100) + 'ms');
    hide(weapon);
    clone.classList.add('dd-thrown-active');

    window.setTimeout(function () {
      impact('weapon', monsterCenter, 280);
      shake(160);
      if (options.onHit) options.onHit();
    }, options.hitTime || 620);

    removeLater(clone, options.duration || 1100, function () {
      show(weapon);
      finish();
    });
  }

  /*
   * WEAPON FIGHT — RANGED
   *
   * Weapon moves to player, fires in place with recoil, monster dies at a
   * distance, then the weapon slides back to its weapon slot.
   */
  function weaponFightRanged(weapon, player, monster, options) {
    options = options || {};

    var finish = once(options.done);
    var weaponRect = rect(weapon);
    var playerRect = rect(player);
    var monsterRect = rect(monster);

    if (!weaponRect || !playerRect || !monsterRect) {
      finish();
      return;
    }

    var clone = appendClone(weapon, 'dd-ranged-weapon-clone', weaponRect);
    if (!clone) {
      finish();
      return;
    }

    var weaponStart = center(weaponRect);
    var playerCenter = center(playerRect);
    var monsterCenter = center(monsterRect);

    var hand = {
      x: playerCenter.x + (options.handOffsetX || 0),
      y: playerCenter.y + (options.handOffsetY || 0)
    };

    setVector(clone, 'join',
      hand.x - weaponStart.x,
      hand.y - weaponStart.y
    );
    setVector(clone, 'return',
      weaponStart.x - hand.x,
      weaponStart.y - hand.y
    );

    clone.dataset.targetX = monsterCenter.x;
    clone.dataset.targetY = monsterCenter.y;
    clone.style.setProperty('--animation-duration', (options.duration || 1000) + 'ms');

    hide(weapon);
    clone.classList.add('dd-ranged-active');

    window.setTimeout(function () {
      impact('weapon', monsterCenter, 280);
      shake(120);
      if (options.onHit) options.onHit();
    }, options.hitTime || 620);

    removeLater(clone, options.duration || 1000, function () {
      show(weapon);
      finish();
    });
  }

  /*
   * Public surface.
   *
   * Nothing in this file calls these automatically.
   */
  global.DeckDungeonAnimations = {
    version: '0.1.0',
    canvas: {
      width: WIDTH,
      height: HEIGHT
    },
    geometry: {
      rect: rect,
      center: center,
      translation: translation
    },
    helpers: {
      moveCard: moveCard,
      impact: impact,
      shake: shake
    },
    equip: equip,
    eat: eat,
    discard: discard,
    flee: flee,
    monsterToPrevious: monsterToPrevious,
    fistFight: fistFight,
    use: use,
    drink: drink,
    deal: deal,
    slideDungeonCards: slideDungeonCards,
    weaponFightMelee: weaponFightMelee,
    weaponFightThrown: weaponFightThrown,
    weaponFightRanged: weaponFightRanged
  };

})(window);
