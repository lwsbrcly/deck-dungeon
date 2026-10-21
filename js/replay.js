// Replay support.
// Parses a run log, starts the real game engine, then drives the game's
// underlying action functions rather than simulating clicks on the controls.

window.Replay = (() => {
    let run = null;
    let nextActionIndex = 0;
    let playing = false;
    let replayClickHandler = null;
    let replayKeyHandler = null;
    let replayLabelObserver = null;

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

        if (/FLEE\s*$/i.test(cleaned)) {
            return { type: 'flee', raw: line };
        }

        const match = cleaned.match(
            /^(\d+)(?:[-┬├└])(\d+)\s+(p\d+)\s+(10|[2-9]|[AJQK])([CDHS])\s+([^\s]+)(?:\s+(\[[^\]]*\]))?/i
        );
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

    function setReplayLabels() {
        // Buttons 1 and 2 are owned by replay. The game normally rewrites these
        // labels whenever selection/state changes; replay must immediately put
        // its own controls back. Buttons 3 and 4 are deliberately left alone.
        const labels = [
            '← Back 1 Step',
            playing ? '❚❚ Pause' : '▶ Play'
        ];

        ['action1', 'action2'].forEach((id, index) => {
            const button = document.getElementById(id);
            if (button && button.textContent !== labels[index]) {
                button.textContent = labels[index];
            }
        });

        const back = document.getElementById('action1');
        const forward = document.getElementById('undoBtn');
        if (back) back.disabled = nextActionIndex <= 0;
        if (forward) forward.disabled = nextActionIndex >= (run ? run.actions.length : 0);
    }

    function installReplayLabelGuard() {
        if (replayLabelObserver) replayLabelObserver.disconnect();

        const actionRow = document.querySelector('.action-buttons');
        if (!actionRow) return;

        replayLabelObserver = new MutationObserver(() => {
            if (window.replayMode) setReplayLabels();
        });

        // Watch the whole action-button area because the game may change either
        // the button text, classes, or the button nodes themselves during render.
        replayLabelObserver.observe(actionRow, {
            childList: true,
            characterData: true,
            subtree: true
        });
    }

    function removeReplayLabelGuard() {
        if (replayLabelObserver) {
            replayLabelObserver.disconnect();
            replayLabelObserver = null;
        }
    }

    function waitForGameIdle(timeout = 10000) {
        return new Promise((resolve, reject) => {
            const started = Date.now();
            function check() {
                if (window.state && Array.isArray(window.state.dungeon) && window.state.dungeon.length > 0 && !window.state.actionInProgress) {
                    resolve();
                    return;
                }
                if (Date.now() - started > timeout) {
                    reject(new Error('Replay timed out waiting for the game board to initialise.'));
                    return;
                }
                setTimeout(check, 50);
            }
            check();
        });
    }

    function waitForActionComplete(timeout = 15000) {
        return new Promise((resolve, reject) => {
            const started = Date.now();
            function check() {
                if (window.state && !window.state.actionInProgress) {
                    resolve();
                    return;
                }
                if (Date.now() - started > timeout) {
                    reject(new Error('Replay timed out waiting for the action to complete.'));
                    return;
                }
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
                window.drinkDirectPotion(player);
                return;
            }
            if (typeof window.discardDungeonPotion !== 'function') throw new Error('Game heart-discard function is unavailable.');
            window.discardDungeonPotion();
            return;
        }

        if (action.suit === 'D') {
            if (action.action === 'equip') {
                if (typeof window.equipWeapon !== 'function') throw new Error('Game equip function is unavailable.');
                window.equipWeapon(player);
                return;
            }
            if (typeof window.discardDungeonWeapon !== 'function') throw new Error('Game weapon-discard function is unavailable.');
            window.discardDungeonWeapon();
            return;
        }

        if (action.suit === 'C' || action.suit === 'S') {
            if (typeof window.fight !== 'function') throw new Error('Game fight function is unavailable.');
            window.fight(player, action.action === 'weapon' ? 'weapon' : 'bare');
            return;
        }

        throw new Error(`Replay cannot execute ${action.card}.`);
    }

    async function executeAction(action) {
        const cardIndex = findCardIndex(action.cardId);
        if (cardIndex < 0) {
            throw new Error(`Replay expected ${action.card} (${action.cardId}), but it is not in the current room.`);
        }

        if (typeof window.selectCard !== 'function') {
            throw new Error('Game card-selection function is unavailable.');
        }

        window.selectCard(cardIndex);
        await new Promise(resolve => setTimeout(resolve, 80));
        invokeGameAction(action);
        await waitForActionComplete();
    }

    async function executeFlee() {
        if (typeof window.refreshDungeon !== 'function') {
            throw new Error('Game flee function is unavailable.');
        }
        window.refreshDungeon();
        await waitForActionComplete();
    }

    async function forwardOneStep() {
        if (!run || nextActionIndex >= run.actions.length) return;
        if (window.state && window.state.actionInProgress) return;

        const action = run.actions[nextActionIndex];
        await (action.type === 'flee' ? executeFlee() : executeAction(action));
        nextActionIndex += 1;
        setReplayLabels();
    }

    function backOneStep() {
        if (!run || nextActionIndex <= 0) return;
        if (window.state && window.state.actionInProgress) return;
        if (typeof window.undoLastAction !== 'function') return;

        window.undoLastAction();
        nextActionIndex -= 1;
        setReplayLabels();
    }

    async function playLoop() {
        if (playing) return;
        playing = true;
        setReplayLabels();

        try {
            while (playing && run && nextActionIndex < run.actions.length) {
                await forwardOneStep();
                if (playing) await new Promise(resolve => setTimeout(resolve, 250));
            }
        } catch (error) {
            playing = false;
            setReplayLabels();
            alert(error.message);
        }

        if (nextActionIndex >= (run ? run.actions.length : 0)) {
            playing = false;
            setReplayLabels();
        }
    }

    function togglePlay() {
        if (!run) return;
        if (playing) {
            playing = false;
            setReplayLabels();
        } else {
            playLoop();
        }
    }

    function takeOver() {
        playing = false;
        window.replayMode = false;
        window.replayRun = null;
        removeReplayLabelGuard();

        if (replayClickHandler) {
            document.removeEventListener('click', replayClickHandler, true);
            replayClickHandler = null;
        }
        if (replayKeyHandler) {
            document.removeEventListener('keydown', replayKeyHandler, true);
            replayKeyHandler = null;
        }

        if (typeof window.render === 'function') window.render();
    }

    function installReplayGuards() {
        if (replayClickHandler) return;

        replayClickHandler = function(event) {
            if (!window.replayMode) return;

            const target = event.target;
            const button = target && target.closest
                ? target.closest('#action1, #action2, #undoBtn, #refreshBtn')
                : null;

            if (button) {
                event.preventDefault();
                event.stopImmediatePropagation();

                if (button.id === 'action1') backOneStep();
                else if (button.id === 'action2') togglePlay();
                else if (button.id === 'undoBtn') forwardOneStep();
                else if (button.id === 'refreshBtn') takeOver();
                return;
            }

            const card = target && target.closest
                ? target.closest('#dungeon .dungeon-card-wrap, #dungeon .card')
                : null;
            if (card) {
                event.preventDefault();
                event.stopImmediatePropagation();
            }
        };

        document.addEventListener('click', replayClickHandler, true);

        replayKeyHandler = function(event) {
            if (!window.replayMode) return;
            const key = String(event.key || '').toLowerCase();
            if (key === 'q' || key === 'w' || key === 'v' || key === 'r') {
                event.preventDefault();
                event.stopImmediatePropagation();
            }
        };
        document.addEventListener('keydown', replayKeyHandler, true);
    }

    async function startReplay(replayRun) {
        run = replayRun;
        configureReplayGame(replayRun);
        installReplayGuards();

        if (typeof window.showScreen === 'function') window.showScreen('game-ui');
        if (typeof window.decodeDeckId !== 'function' || typeof window.startGame !== 'function') {
            throw new Error('Game start functions are unavailable.');
        }

        const seed = window.decodeDeckId(replayRun.deckId);
        window.startGame(seed, replayRun.deckId);
        await waitForGameIdle();

        // Install after the game has rendered the initial action controls, then
        // immediately take ownership of buttons 1 and 2.
        installReplayLabelGuard();
        setReplayLabels();
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
        button.addEventListener('click', event => {
            event.preventDefault();
            window.watchReplay();
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindWatchReplayButton);
    else bindWatchReplayButton();

    return {
        parseRunLog,
        parseActionLine,
        processRunLog,
        startReplay,
        watchReplay,
        forwardOneStep,
        backOneStep,
        togglePlay,
        takeOver
    };
})();
