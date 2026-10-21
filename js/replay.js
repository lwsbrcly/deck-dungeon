// Replay support — deliberately kept separate from the main game logic.
// This first step only parses and validates a pasted copied run log.

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

        return {
            deckId,
            mode,
            outcome,
            actions: actionLines
        };
    }

    function processRunLog(rawLog) {
        const run = parseRunLog(rawLog);
        const result = `${run.actions.length} actions. ${run.outcome.toLowerCase()}.`;

        console.log('Replay run log received:', run);
        alert(`Run log received. Deck ID=${run.deckId}. ${run.mode} mode. ${result}`);

        return run;
    }

    window.processReplayLog = processRunLog;

    return { parseRunLog, processRunLog };
})();
