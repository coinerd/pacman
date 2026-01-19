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

    let normalizedSeconds = delta > 1 ? msToSeconds(delta) : delta;

    if (delta > 0 && delta < 0.001) {
        normalizedSeconds = delta * 1000;
    }

    if (!hasWarnedAboutDeltaUnits && (delta > 1000 || (delta > 0 && delta < 0.001))) {
        console.warn(
            `[Time] Delta (${delta}) looks like the wrong unit; normalizing to seconds.`
        );
        hasWarnedAboutDeltaUnits = true;
    }

    return Math.max(0, normalizedSeconds);
}
