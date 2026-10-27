// Replay support.
// Parses a run log, starts the real game engine, then drives the game's
// underlying action functions rather than simulating clicks on the controls.

window.Replay = (() => {
    let run = null;
    let nextActionIndex = 0;
    let playing = false;
    let playGeneration = 0;
    let replayClickHandler = null;
    let replayKeyHandler = null;
    let replayLabelTimer = null;
    const PLAY_INTERVAL_MS = 1500;

    function cardIdFromLog(card) {
        const match = String(card || '').trim().toUpperCase().match(/^(10|[2-9]|[AJQK])([CDHS])$/);
        if (!match) throw new Error(`Invalid card code: ${card}`);
        const suitNames = { C: 'clubs', D: 'diamonds', H: 'hearts', S: 'spades' };
        return `${suitNames[match[2]]}${match[1]}`;
    }

    function parseRunLog(rawLog) {
        if (typeof rawLog !== 'string' || !rawLog.trim()) throw new Error('Please paste a run log first.');
        const lines = rawLog.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
        const deckLine = lines.find(line => /^•?\s*Deck ID:\s*/i.test(line));
        const modeLine = lines.find(line => /^•?\s*Mode:\s*(NORMAL|HARD|ULTRA)\s*$/i.test(line));
        const outcomeLine = lines.find(line => /^•?\s*GAME OVER\s+—\s+/i.test(line));
        if (!deckLine) throw new Error('Run log is missing a Deck ID.');
        if (!modeLine) throw new Error('Run log is missing a Mode (NORMAL, HARD or ULTRA).');
        if (!outcomeLine) throw new Error('Run log is missing its GAME OVER line.');
        const deckId = deckLine.replace(/^•?\s*Deck ID:\s*/i, '').trim();
        const mode = modeLine.match(/^•?\s*Mode:\s*(NORMAL|HARD|ULTRA)\s*$/i)[1].toUpperCase();
        const outcome = outcomeLine.replace(/^•?\s*GAME OVER\s+—\s*/i, '').trim();
        const actionLines = lines.filter(line => /^•?\s*\d+(?:[-┬├└])(?:\d+|FLEE)\b/i.test(line));
        if (!deckId) throw new Error('Run log has an empty Deck ID.');
        if (!actionLines.length) throw new Error('Run log contains no actions.');
        return { deckId, mode, outcome, actions: actionLines.map(parseActionLine) };
    }

    function parseActionLine(line) {
        const cleaned = line.replace(/^•\s*/, '').trim();
        if (/FLEE\s*$/i.test(cleaned)) return { type: 'flee', raw: line };
        const match = cleaned.match(/^(\d+)(?:[-┬├└])(\d+)\s+(p\d+)\s+(10|[2-9]|[AJQK])([CDHS])\s+([^\s]+)(?:\s+(\[[^\]]*\]))?/i);
        if (!match) throw new Error(`Could not parse action line: ${line}`);
        const room = Number(match[1]);
        const actionNumber = Number(match[2]);
        const player = Number(match[3].slice(1));
        const card = `${match[4]}${match[5]}`.toUpperCase();
        const result = match[6].toUpperCase();
        const hp = match[7] || null;
        const suit = card.slice(-1);
        let action;
        if (suit === 'H') action = result === 'D' ? 'discard' : 'consume';
        else if (suit === 'D') action = result === 'D' ? 'discard' : 'equip';
        else if (suit === 'C' || suit === 'S') action = result === '--' ? 'bare' : 'weapon';
        else throw new Error(`Unknown card suit in action line: ${line}`);
        return {
            type: 'action', room, actionNumber, player, card, cardId: cardIdFromLog(card),
            suit, action,
            weapon: (suit === 'C' || suit === 'S') && result !== '--' ? result : null,
            weaponId: (suit === 'C' || suit === 'S') && result !== '--' ? cardIdFromLog(result) : null,
            hp, raw: line
        };
    }

    function configureReplayGame(replayRun) {
        const modeSelect = document.getElementById('modeSelect');
        const hardInput = document.getElementById('hardModeInput');
        const ultraInput = document.getElementById('ultraHardModeInput');
        const hasP2 = replayRun.actions.some(action => action.type === 'action' && action.player === 2);
        if (modeSelect) modeSelect.value = hasP2 ? 'coop' : 'solo_dagger';
        if (hardInput) hardInput.checked = replayRun.mode === 'HARD' || replayRun.mode === 'ULTRA';
        if (ultraInput) ultraInput.checked = replayRun.mode === 'ULTRA';
        window.replayMode = true;
        window.replayRun = replayRun;
        nextActionIndex = 0;
        playing = false;
    }

    // Replay controls are deliberately independent of the game's contextual
    // action labels. Buttons 1-4 always display replay controls while active.
    function setReplayLabels() {
        if (!window.replayMode) return;
        const controls = [
            { id: 'action1', label: '|◀', accessibleLabel: 'Back one step', title: 'Back one step' },
            {
                id: 'action2',
                label: playing ? 'Ⅱ' : '▶',
                accessibleLabel: playing ? 'Pause replay' : 'Play replay',
                title: playing ? 'Pause replay' : 'Play replay'
            },
            { id: 'undoBtn', label: '▶|', accessibleLabel: 'Forward one step', title: 'Forward one step' },
            { id: 'refreshBtn', label: 'Take Over', accessibleLabel: 'Take over gameplay', title: 'Take over gameplay' }
        ];
        controls.forEach(control => {
            const button = document.getElementById(control.id);
            if (!button) return;
            button.classList.remove('action-button-hidden');
            if (button.textContent !== control.label) button.textContent = control.label;
            button.setAttribute('aria-label', control.accessibleLabel);
            button.title = control.title;
        });

        // Take Over is a replay control, not the normal Flee action.
        // Flee becomes unavailable after the room's first action, but Take Over
        // must stay enabled so the player can resume control at any replay step.
        const takeOverButton = document.getElementById('refreshBtn');
        if (takeOverButton) takeOverButton.disabled = false;

        const back = document.getElementById('action1');
        const forward = document.getElementById('undoBtn');
        if (back) back.disabled = nextActionIndex <= 0;
        if (forward) forward.disabled = nextActionIndex >= (run ? run.actions.length : 0);
    }

    // Do not observe the action row: game.js mutates it during render and an
    // attribute/text MutationObserver can feed back into render indefinitely.
    // A lightweight poll is sufficient to re-assert replay labels after render.
    function startReplayLabelGuard() {
        stopReplayLabelGuard();
        setReplayLabels();
        replayLabelTimer = setInterval(setReplayLabels, 100);
    }

    function stopReplayLabelGuard() {
        if (replayLabelTimer) {
            clearInterval(replayLabelTimer);
            replayLabelTimer = null;
        }
    }

    function waitForGameIdle(timeout = 10000) {
        return new Promise((resolve, reject) => {
            const started = Date.now();
            function check() {
                if (window.state && Array.isArray(window.state.dungeon) && window.state.dungeon.length > 0 && !window.state.actionInProgress) return resolve();
                if (Date.now() - started > timeout) return reject(new Error('Replay timed out waiting for the game board to initialise.'));
                setTimeout(check, 50);
            }
            check();
        });
    }

    function waitForActionComplete(timeout = 15000) {
        return new Promise((resolve, reject) => {
            const started = Date.now();
            function check() {
                if (window.state && !window.state.actionInProgress) return resolve();
                if (Date.now() - started > timeout) return reject(new Error('Replay timed out waiting for the action to complete.'));
                setTimeout(check, 50);
            }
            check();
        });
    }

    function findCardIndex(cardId) {
        const state = window.state;
        if (!state || !Array.isArray(state.dungeon)) return -1;
        return state.dungeon.findIndex(card => {
            if (!card) return false;
            if (card.id === cardId) return true;
            return `${card.suit}${card.rank || card.value}`.toLowerCase() === cardId.toLowerCase();
        });
    }

    function invokeGameAction(action) {
        const player = `p${action.player}`;
        if (action.suit === 'H') {
            if (action.action === 'consume') {
                if (typeof window.drinkDirectPotion !== 'function') throw new Error('Game consume function is unavailable.');
                window.drinkDirectPotion(player); return;
            }
            if (typeof window.discardDungeonPotion !== 'function') throw new Error('Game heart-discard function is unavailable.');
            window.discardDungeonPotion(); return;
        }
        if (action.suit === 'D') {
            if (action.action === 'equip') {
                if (typeof window.equipWeapon !== 'function') throw new Error('Game equip function is unavailable.');
                window.equipWeapon(player); return;
            }
            if (typeof window.discardDungeonWeapon !== 'function') throw new Error('Game weapon-discard function is unavailable.');
            window.discardDungeonWeapon(); return;
        }
        if (action.suit === 'C' || action.suit === 'S') {
            if (typeof window.fight !== 'function') throw new Error('Game fight function is unavailable.');
            window.fight(player, action.action === 'weapon' ? 'weapon' : 'bare'); return;
        }
        throw new Error(`Replay cannot execute ${action.card}.`);
    }

    async function executeAction(action) {
        const cardIndex = findCardIndex(action.cardId);
        if (cardIndex < 0) throw new Error(`Replay expected ${action.card} (${action.cardId}), but it is not in the current room.`);
        if (typeof window.selectCard !== 'function') throw new Error('Game card-selection function is unavailable.');
        window.selectCard(cardIndex);
        await new Promise(resolve => setTimeout(resolve, 80));
        invokeGameAction(action);
        await waitForActionComplete();
    }

    async function executeFlee() {
        if (typeof window.refreshDungeon !== 'function') throw new Error('Game flee function is unavailable.');
        window.refreshDungeon();
        await waitForActionComplete();
    }

    async function forwardOneStep() {
        if (!run || nextActionIndex >= run.actions.length || (window.state && window.state.actionInProgress)) return;
        const action = run.actions[nextActionIndex];
        await (action.type === 'flee' ? executeFlee() : executeAction(action));
        nextActionIndex += 1;
        setReplayLabels();
    }

    function backOneStep() {
        if (!run || nextActionIndex <= 0 || (window.state && window.state.actionInProgress)) return;
        if (typeof window.undoLastAction !== 'function') return;
        window.undoLastAction();
        nextActionIndex -= 1;
        setReplayLabels();
    }

    function waitForReplayDelay(startedAt, generation) {
        const remaining = Math.max(0, PLAY_INTERVAL_MS - (Date.now() - startedAt));
        return new Promise(resolve => {
            setTimeout(() => resolve(generation === playGeneration && playing), remaining);
        });
    }

    async function playLoop() {
        if (playing) return;
        playing = true;
        const generation = ++playGeneration;
        setReplayLabels();
        try {
            while (playing && generation === playGeneration && run && nextActionIndex < run.actions.length) {
                const actionStartedAt = Date.now();
                await forwardOneStep();
                if (playing && generation === playGeneration) {
                    const shouldContinue = await waitForReplayDelay(actionStartedAt, generation);
                    if (!shouldContinue) break;
                }
            }
        } catch (error) {
            playing = false;
            playGeneration += 1;
            setReplayLabels();
            alert(error.message);
        }
        if (generation === playGeneration && nextActionIndex >= (run ? run.actions.length : 0)) {
            playing = false;
            setReplayLabels();
        }
    }

    function togglePlay() {
        if (!run) return;
        if (playing) {
            playing = false;
            playGeneration += 1;
            setReplayLabels();
        } else {
            playLoop();
        }
    }

    function restoreStandardActionLabels() {
        const action1 = document.getElementById('action1');
        const action2 = document.getElementById('action2');
        const undo = document.getElementById('undoBtn');
        const flee = document.getElementById('refreshBtn');

        // The first two labels are contextual and will be repopulated by render()
        // when a card is selected. Undo and Flee have stable default labels.
        if (action1) { action1.textContent = ''; action1.disabled = false; }
        if (action2) { action2.textContent = ''; action2.disabled = false; }
        if (undo) { undo.textContent = '↩ Undo'; undo.disabled = !(window.historyStack && window.historyStack.length); }
        if (flee) flee.textContent = 'Flee';

        // Remove replay-only accessibility metadata as well as the compact icons.
        [action1, action2, undo, flee].forEach(button => {
            if (!button) return;
            button.removeAttribute('aria-label');
            button.removeAttribute('title');
        });
    }

    function endReplay(options = {}) {
        playing = false;
        playGeneration += 1;
        run = null;
        nextActionIndex = 0;

        window.replayMode = false;
        window.replayRun = null;
        stopReplayLabelGuard();

        if (replayClickHandler) {
            document.removeEventListener('click', replayClickHandler, true);
            replayClickHandler = null;
        }
        if (replayKeyHandler) {
            document.removeEventListener('keydown', replayKeyHandler, true);
            replayKeyHandler = null;
        }

        restoreStandardActionLabels();

        // New-game/navigation callers pass render:false because they immediately
        // replace or hide the current board. Take Over renders the current board
        // so the normal contextual actions are restored straight away.
        if (options.render !== false && typeof window.render === 'function') {
            window.render();
        }
    }

    function takeOver() {
        endReplay();
    }

    function installReplayGuards() {
        if (replayClickHandler) return;
        replayClickHandler = function(event) {
            if (!window.replayMode) return;
            const target = event.target;
            const button = target && target.closest ? target.closest('#action1, #action2, #undoBtn, #refreshBtn') : null;
            if (button) {
                event.preventDefault(); event.stopImmediatePropagation();
                if (button.id === 'action1') backOneStep();
                else if (button.id === 'action2') togglePlay();
                else if (button.id === 'undoBtn') forwardOneStep();
                else if (button.id === 'refreshBtn') takeOver();
                return;
            }
            const card = target && target.closest ? target.closest('#dungeon .dungeon-card-wrap, #dungeon .card') : null;
            if (card) { event.preventDefault(); event.stopImmediatePropagation(); }
        };
        document.addEventListener('click', replayClickHandler, true);
        replayKeyHandler = function(event) {
            if (!window.replayMode) return;
            const key = String(event.key || '').toLowerCase();
            if (key === 'q' || key === 'w' || key === 'v' || key === 'r') { event.preventDefault(); event.stopImmediatePropagation(); }
        };
        document.addEventListener('keydown', replayKeyHandler, true);
    }

    async function startReplay(replayRun) {
        // Starting a replay after another replay first tears down its timer,
        // event guards and labels so only one replay session can own the controls.
        endReplay({ render: false });
        run = replayRun;
        configureReplayGame(replayRun);
        installReplayGuards();
        if (typeof window.showScreen === 'function') window.showScreen('game-ui');
        if (typeof window.decodeDeckId !== 'function' || typeof window.startGame !== 'function') throw new Error('Game start functions are unavailable.');
        const seed = window.decodeDeckId(replayRun.deckId);
        window.startGame(seed, replayRun.deckId, { replay: true });
        await waitForGameIdle();
        startReplayLabelGuard();
    }

    function processRunLog(rawLog) {
        const parsed = parseRunLog(rawLog);
        console.log('Replay run log received:', parsed);
        return parsed;
    }

    window.processReplayLog = processRunLog;
    async function watchReplay() {
        const input = document.getElementById('replayLogInput');
        try {
            const parsed = parseRunLog(input ? input.value : '');
            await startReplay(parsed);
            return parsed;
        } catch (error) {
            takeOver();
            alert(error.message);
            return null;
        }
    }
    window.watchReplay = watchReplay;

    function bindWatchReplayButton() {
        const button = document.querySelector('#replayLogInput + button');
        if (!button || button.dataset.replayBound === 'true') return;
        button.dataset.replayBound = 'true';
        button.addEventListener('click', event => { event.preventDefault(); window.watchReplay(); });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindWatchReplayButton);
    else bindWatchReplayButton();

    return { parseRunLog, parseActionLine, processRunLog, startReplay, watchReplay, forwardOneStep, backOneStep, togglePlay, takeOver, endReplay };
})();

// Board/undo fix: game.js keeps four keyed card wrappers for FLIP animation,
// but reusing those wrappers can leave them in the old DOM order. Keep the
// wrappers physically ordered by their logical slot after every render.
(function installUndoBoardFix() {
    const originalRender = window.render;
    if (typeof originalRender !== 'function') return;

    window.render = function () {
        originalRender.apply(this, arguments);

        const dungeon = document.getElementById('dungeon');
        if (!dungeon) return;

        const wraps = Array.from(dungeon.children)
            .filter(el => el && el.classList && el.classList.contains('dungeon-card-wrap'))
            .sort((a, b) => (a._slotIndex ?? 999) - (b._slotIndex ?? 999));

        wraps.forEach(wrap => dungeon.appendChild(wrap));
    };

    function restoreWithAnimation(isGameOverUndo) {
        if (window.state && window.state.actionInProgress) return;
        if (!Array.isArray(window.historyStack) || window.historyStack.length === 0) return;

        if (typeof window.resetDungeonDom === 'function') window.resetDungeonDom();
        window.state = window.historyStack.pop();
        window.state.actionInProgress = false;

        if (isGameOverUndo) {
            window.state.over = false;
            const overlay = document.getElementById('overlay');
            if (overlay) overlay.classList.remove('show');
        }

        if (typeof window.renderLog === 'function') window.renderLog();
        if (typeof window.renderAfterAction === 'function') window.renderAfterAction();
        else window.render();
    }

    window.undoLastAction = function () {
        restoreWithAnimation(false);
    };

    window.undoFromGameOver = function () {
        restoreWithAnimation(true);
    };
})();