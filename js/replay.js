// Replay support — deliberately kept separate from the main game logic.
// This step parses a pasted copied run log into a clean sequence of replay actions.

window.Replay = (() => {
    function parseRunLog(rawLog) {
        if (typeof rawLog !== 'string' || !rawLog.trim()) {
            throw new Error('Please paste a run log first.');
        }

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

        // Action lines begin with the compact room/action number, e.g. 1-1 or 2┬FLEE.
        const actionLines = lines.filter(line =>
            /^•?\s*\d+(?:[-┬├└])(?:\d+|FLEE)\b/i.test(line)
        );

        if (!deckId) throw new Error('Run log has an empty Deck ID.');
        if (!actionLines.length) throw new Error('Run log contains no actions.');

        const actions = actionLines.map(parseActionLine);

        return {
            deckId,
            mode,
            outcome,
            actions
        };
    }

    function parseActionLine(line) {
        const cleaned = line.replace(/^•\s*/, '').trim();

        // Flee entries are deliberately treated as their own action type.
        if (/FLEE\s*$/i.test(cleaned)) {
            return {
                type: 'flee',
                raw: line
            };
        }

        // Expected action format is broadly:
        //   1-1 p1 7C 2D [20,15]
        //   1-2 p1 5H D [15,15]
        //   1-3 p1 8D E
        //   1-4 p1 9S --
        // The exact room/action prefix is retained, but the replay executor only
        // needs player, card and the suit-specific result.
        const match = cleaned.match(
            /^(\d+)(?:[-┬├└])(\d+)\s+(p\d+)\s+([0-9AJQK]+[CDHS])\s+([^\s]+)(?:\s+(\[[^\]]*\]))?/i
        );

        if (!match) {
            throw new Error(`Could not parse action line: ${line}`);
        }

        const room = Number(match[1]);
        const actionNumber = Number(match[2]);
        const player = Number(match[3].slice(1));
        const card = match[4].toUpperCase();
        const result = match[5].toUpperCase();
        const hp = match[6] || null;
        const suit = card.slice(-1);

        let action;

        if (suit === 'H') {
            // Hearts: button 1 = consume, button 2 = discard.
            action = result === 'D' ? 'discard' : 'consume';
        } else if (suit === 'D') {
            // Diamonds: button 1 = equip, button 2 = discard.
            action = result === 'D' ? 'discard' : 'equip';
        } else if (suit === 'C' || suit === 'S') {
            // Clubs / Spades: button 1 = fight with weapon, button 2 = fight bare.
            action = result === '--' ? 'bare' : 'weapon';
        } else {
            throw new Error(`Unknown card suit in action line: ${line}`);
        }

        return {
            type: 'action',
            room,
            actionNumber,
            player,
            card,
            suit,
            action,
            weapon: (suit === 'C' || suit === 'S') && result !== '--' ? result : null,
            hp,
            raw: line
        };
    }

    function processRunLog(rawLog) {
        const run = parseRunLog(rawLog);

        console.log('Replay run log received:', run);

        const actionSummary = run.actions.map((action, index) => {
            if (action.type === 'flee') {
                return `${index + 1}. FLEE`;
            }

            let detail = `${action.player}: ${action.card} → ${action.action}`;
            if (action.weapon) detail += ` (${action.weapon})`;
            if (action.hp) detail += ` ${action.hp}`;
            return `${index + 1}. ${detail}`;
        }).join('\n');

        alert(
            `Run log received.\n\n` +
            `Deck ID: ${run.deckId}\n` +
            `Mode: ${run.mode}\n` +
            `Actions: ${run.actions.length}\n\n` +
            actionSummary
        );

        return run;
    }

    window.processReplayLog = processRunLog;

    function watchReplay() {
        const input = document.getElementById('replayLogInput');
        try {
            return processRunLog(input ? input.value : '');
        } catch (error) {
            alert(error.message);
            return null;
        }
    }

    window.watchReplay = watchReplay;

    return { parseRunLog, parseActionLine, processRunLog, watchReplay };
})();
