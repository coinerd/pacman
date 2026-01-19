export const TimeUnit = {
    SECONDS: 'seconds',
    MILLISECONDS: 'milliseconds'
};

let hasWarnedAboutDeltaUnits = false;

export function msToSeconds(milliseconds) {
    return milliseconds / 1000;
}

export function secondsToMs(seconds) {
    return seconds * 1000;
}

export function normalizeDeltaSeconds(delta) {
    if (!Number.isFinite(delta)) {
        return 0;
    }

    if ((delta > 1 || (delta > 0 && delta < 0.001)) && !hasWarnedAboutDeltaUnits) {
        console.warn(`[Time] Delta (${delta}) looks like the wrong unit; normalizing to seconds.`);
        hasWarnedAboutDeltaUnits = true;
    }

    if (delta > 1) {
        return msToSeconds(delta);
    }

    if (delta > 0 && delta < 0.001) {
        return delta * 1000;
    }

    return Math.max(0, delta);
}
