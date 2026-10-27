/* Undo/board-slot fix.
 *
 * The game keeps four persistent dungeon-card wrappers so FLIP animations
 * can reuse them. When a card disappears, however, the wrappers can remain
 * in their old DOM order. That makes a restored card appear in the wrong
 * visual slot even though state.dungeon itself is correct.
 *
 * Keep the DOM order aligned with each wrapper's logical slot, then use the
 * existing renderAfterAction FLIP path when undo restores a previous state.
 */
(function () {
  var originalRender = window.render;
  var originalUndo = window.undoLastAction;
  var originalUndoFromGameOver = window.undoFromGameOver;

  if (typeof originalRender !== 'function') return;

  window.render = function () {
    originalRender.apply(this, arguments);

    var dungeon = document.getElementById('dungeon');
    if (!dungeon) return;

    var wraps = Array.prototype.slice.call(dungeon.querySelectorAll(':scope > .dungeon-card-wrap'));
    wraps.sort(function (a, b) {
      var aSlot = typeof a._slotIndex === 'number' ? a._slotIndex : 999;
      var bSlot = typeof b._slotIndex === 'number' ? b._slotIndex : 999;
      return aSlot - bSlot;
    });

    // appendChild moves an existing node without recreating it, so this also
    // preserves the card DOM used by the FLIP animation system.
    for (var i = 0; i < wraps.length; i++) {
      dungeon.appendChild(wraps[i]);
    }
  };

  function restoreWithAnimation(isGameOverUndo) {
    if (window.state && window.state.actionInProgress) return;
    if (!window.historyStack || window.historyStack.length === 0) return;

    if (typeof window.resetDungeonDom === 'function') {
      window.resetDungeonDom();
    }

    window.state = window.historyStack.pop();
    window.state.actionInProgress = false;
    if (isGameOverUndo) {
      window.state.over = false;
      var overlay = document.getElementById('overlay');
      if (overlay) overlay.classList.remove('show');
    }

    if (typeof window.renderLog === 'function') window.renderLog();

    // renderAfterAction captures the current card positions, restores the
    // state, and FLIPs every surviving card to its restored slot. In the
    // example 1 2 3 -> action slot 2 -> 1 3 -> undo, card 3 therefore slides
    // back from slot 2 to slot 3 while the restored card occupies slot 2.
    if (typeof window.renderAfterAction === 'function') {
      window.renderAfterAction();
    } else {
      window.render();
    }
  }

  window.undoLastAction = function () {
    restoreWithAnimation(false);
  };

  window.undoFromGameOver = function () {
    restoreWithAnimation(true);
  };
})();
