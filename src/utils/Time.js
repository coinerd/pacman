export const TimeUnit = {
    SECONDS: 'seconds',
    MILLISECONDS: 'milliseconds'
};

export function msToSeconds(milliseconds) {
    return milliseconds / 1000;
}

export function secondsToMs(seconds) {
    return seconds * 1000;
}
