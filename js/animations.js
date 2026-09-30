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
      className.split(/\\s+/).forEach(function (name) {
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

  function jolt(element, duration) {
    if (!element) return;

    element.classList.remove('dd-monster-jolt');
    void element.offsetWidth;
    element.classList.add('dd-monster-jolt');

    window.setTimeout(function () {
      element.classList.remove('dd-monster-jolt');
    }, duration || 180);
  }

  function setVector(element, property, x, y) {
    element.style.setProperty('--' + property + '-x', x + 'px');
    element.style.setProperty('--' + property + '-y', y + 'px');
  }

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

    clone.classList.add(options.animationClass || 'dd-animation-move-active');

    removeLater(clone, options.duration || 500, function () {
      if (options.hideSource !== false) show(source);
      finish();
    });
  }

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
    clone.style.setProperty('--lift-scale', options.liftScale || '1.08');
    clone.style.setProperty(
      '--animation-duration',
      (options.duration || 650) + 'ms'
    );

    hide(card);
    clone.classList.add(options.animationClass || 'dd-lift-travel-slam-active');

    if (options.sound) {
      window.setTimeout(function () {
        options.sound();
      }, options.soundTime || 100);
    }

    window.setTimeout(function () {
      impact(options.impactType || 'weapon', center(targetRect), 320);
      shake(170);
    }, options.impactTime || 400);

    removeLater(clone, options.duration || 1100, function () {
      show(card);
      finish();
    });
  }

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

    if (options.sound || typeof global.eatFoodSound === 'function') {
      var sound = options.sound || global.eatFoodSound;
      sound();
    }

    window.setTimeout(function () {
      impact('heart', center(playerRect), 280);
    }, 500);

    removeLater(clone, 770, function () {
      show(food);
      finish();
    });
  }

  function use(card, player, options) {
    options = options || {};
    options.className = options.className || 'dd-use-clone';
    options.animationClass = options.animationClass || 'dd-use-active';
    options.impactType = options.impactType || 'heart';
    options.duration = options.duration || 650;
    options.impactTime = options.impactTime || 403;
    options.sound = options.sound || (
      typeof global.weaponEquipSound === 'function'
        ? global.weaponEquipSound
        : null
    );
    options.soundTime = options.soundTime || 100;

    liftTravelSlam(card, player, options);
  }

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

    if (options.sound || typeof global.eatFoodSound === 'function') {
      var sound = options.sound || global.eatFoodSound;
      sound();
    }

    window.setTimeout(function () {
      impact('heart', target, 280);
    }, options.impactTime || 700);

    removeLater(clone, options.duration || 900, function () {
      show(card);
      finish();
    });
  }

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

    if (options.sound) options.sound(valid.length);

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

    setVector(clone, 'fall', 30, sourceRect.height * 6.2);
    clone.style.setProperty('--animation-duration', '560ms');
    clone.style.setProperty('--topple-x', '8px');
    clone.style.setProperty('--topple-y', '18px');

    hide(card);
    clone.classList.add('dd-discard-active');

    if (typeof global.discardSound === 'function') global.discardSound();

    removeLater(clone, 560, function () {
      show(card);
      finish();
    });
  }

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

    if (options.sound) options.sound();

    remaining.forEach(function (card) {
      var sourceRect = rect(card);
      var deckRect = rect(deck);

      if (!sourceRect || !deckRect) {
        finished += 1;
        if (finished === remaining.length) complete();
        return;
      }

      var clone = appendClone(card, 'dd-flee-clone', sourceRect);
      if (!clone) {
        finished += 1;
        if (finished === remaining.length) complete();
        return;
      }

      var move = translation(sourceRect, deckRect);
      setVector(clone, 'move', move.x, move.y);
      clone.style.setProperty('--animation-duration', '650ms');
      clone.style.zIndex = '999';
      hide(card);
      clone.classList.add('dd-flee-active');

      removeLater(clone, 650, function () {
        finished += 1;
        if (finished === remaining.length) complete();
      });
    });
  }

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
      window.setTimeout(function () { options.sound(); }, 320);
      window.setTimeout(function () { options.sound(); }, 540);
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
      finish();
    });
  }

  function weaponFightMelee(weapon, player, monster, options) {
    options = options || {};

    var finish = once(options.done);
    var weaponRect = rect(weapon);
    var monsterRect = rect(monster);

    if (!weaponRect || !monsterRect) {
      finish();
      return;
    }

    var clone = appendClone(weapon, 'dd-melee-weapon-clone', weaponRect);
    if (!clone) {
      finish();
      return;
    }

    // The attack connects at 50% across / 25% down on both cards.
    // Because the weapon is rotated at impact, calculate the translation
    // required for that rotated point to land exactly on the monster point.
    var weaponContact = {
      x: weaponRect.centerX,
      y: weaponRect.top + weaponRect.height * 0.25
    };
    var monsterContact = {
      x: monsterRect.centerX,
      y: monsterRect.top + monsterRect.height * 0.25
    };

    var slotIndex = Number(options.slotIndex);
    var slotAngles = [-60, -30, 5, 30];
    var angle = slotAngles[slotIndex];
    if (typeof angle !== 'number') angle = 0;
    var radians = angle * Math.PI / 180;

    var localContactY = -weaponRect.height * 0.25;
    var rotatedContactX = -localContactY * Math.sin(radians);
    var rotatedContactY = localContactY * Math.cos(radians);

    var targetCenterX = monsterContact.x - rotatedContactX;
    var targetCenterY = monsterContact.y - rotatedContactY;

    var move = {
      x: targetCenterX - weaponRect.centerX,
      y: targetCenterY - weaponRect.centerY
    };

    setVector(clone, 'move', move.x, move.y);
    setVector(clone, 'return', -move.x, -move.y);
    clone.style.setProperty('--melee-angle', angle + 'deg');
    clone.style.setProperty('--lift-scale', '1.08');
    clone.style.setProperty('--animation-duration', (options.duration || 850) + 'ms');

    hide(weapon);
    clone.classList.add('dd-melee-active');

    window.setTimeout(function () {
      if (options.sound || typeof global.rangedAttackSound === 'function') {
        var sound = options.sound || global.rangedAttackSound;
        sound();
      }
      impact('hit', monsterContact, 320);
      shake(170);
    }, options.impactTime || 450);

    removeLater(clone, options.duration || 850, function () {
      show(weapon);
      finish();
    });
  }

  /*
   * WEAPON FIGHT — THROWN
   *
   * A thrown weapon is consumed by the attack. It aims, draws back away from
   * the monster, launches rapidly from that pulled-back position, hits, then
   * disappears. The weapon slot fades back in with the player's next weapon.
   * There is deliberately no return flight: the thrown weapon has been spent.
   */
  function weaponFightThrown(weapon, player, monster, options) {
    options = options || {};

    var finish = once(options.done);
    var weaponRect = rect(weapon);
    var monsterRect = rect(monster);

    if (!weaponRect || !monsterRect) {
      finish();
      return;
    }

    var clone = appendClone(weapon, 'dd-thrown-weapon-clone', weaponRect);
    if (!clone) {
      finish();
      return;
    }

    var weaponCenter = center(weaponRect);
    var monsterCenter = center(monsterRect);
    var dx = monsterCenter.x - weaponCenter.x;
    var dy = monsterCenter.y - weaponCenter.y;
    var distance = Math.sqrt(dx * dx + dy * dy) || 1;
    var unitX = dx / distance;
    var unitY = dy / distance;

    // Use the ranged aiming angle, then turn the card 180° so the BOTTOM
    // edge points at the monster. Normalise the result so CSS takes the
    // shortest rotation path instead of wrapping through a full turn.
    var rangedAngle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
    var aimAngle = rangedAngle - 180;
    while (aimAngle > 180) aimAngle -= 360;
    while (aimAngle < -180) aimAngle += 360;

    setVector(clone, 'pull', -unitX * (options.pullDistance || 32), -unitY * (options.pullDistance || 32));
    setVector(clone, 'move',
      monsterCenter.x - weaponCenter.x,
      monsterCenter.y - weaponCenter.y
    );

    clone.style.setProperty('--aim-angle', aimAngle + 'deg');
    clone.style.setProperty('--animation-duration', (options.duration || 760) + 'ms');

    hide(weapon);
    clone.classList.add('dd-thrown-active');

    // The hit happens at the end of the fast launch, then the thrown card
    // fades out rather than returning to the slot.
    window.setTimeout(function () {
      if (options.sound || typeof global.punchSound === 'function') {
        var sound = options.sound || global.punchSound;
        sound();
      }
      impact('hit', monsterCenter, 280);
      shake(160);
      if (options.onHit) options.onHit();
    }, options.impactTime || 560);

    removeLater(clone, options.duration || 760, function () {
      show(weapon);
      weapon.classList.remove('dd-thrown-returning');
      void weapon.offsetWidth;
      weapon.classList.add('dd-thrown-returning');

      window.setTimeout(function () {
        weapon.classList.remove('dd-thrown-returning');
        finish();
      }, options.returnFadeDuration || 160);
    });
  }

  function weaponFightRanged(weapon, player, monster, options) {
    options = options || {};

    var finish = once(options.done);
    var weaponRect = rect(weapon);
    var monsterRect = rect(monster);

    if (!weaponRect || !monsterRect) {
      finish();
      return;
    }

    var clone = appendClone(weapon, 'dd-ranged-weapon-clone', weaponRect);
    if (!clone) {
      finish();
      return;
    }

    var weaponStart = center(weaponRect);
    var monsterCenter = center(monsterRect);

    var dx = monsterCenter.x - weaponStart.x;
    var dy = monsterCenter.y - weaponStart.y;
    var distance = Math.sqrt(dx * dx + dy * dy) || 1;
    var unitX = dx / distance;
    var unitY = dy / distance;

    var aimAngle = Math.atan2(dy, dx) * 180 / Math.PI + 90;

    var loadDistance = options.loadDistance || 15;
    var recoilDistance = options.recoilDistance || 40;

    setVector(clone, 'load', unitX * loadDistance, unitY * loadDistance);
    setVector(clone, 'recoil', -unitX * recoilDistance, -unitY * recoilDistance);

    clone.style.setProperty('--aim-angle', aimAngle + 'deg');
    clone.style.setProperty('--animation-duration', (options.duration || 1200) + 'ms');

    hide(weapon);
    clone.classList.add('dd-ranged-active');

    window.setTimeout(function () {
      if (options.sound || typeof global.punchSound === 'function') {
        var sound = options.sound || global.punchSound;
        sound();
      }
      impact('hit', monsterCenter, 280);
      jolt(monster, 180);
      if (options.onHit) options.onHit();
    }, options.hitTime || 600);

    removeLater(clone, options.duration || 1200, function () {
      show(weapon);
      finish();
    });
  }

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
