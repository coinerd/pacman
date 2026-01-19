const loadTimeUtils = async () => {
    jest.resetModules();
    return import('../../src/utils/Time.js');
};

describe('Time utilities', () => {
    test('normalizeDeltaSeconds converts milliseconds to seconds', async () => {
        const { normalizeDeltaSeconds } = await loadTimeUtils();

        expect(normalizeDeltaSeconds(16)).toBeCloseTo(0.016, 5);
    });

    test('normalizeDeltaSeconds preserves seconds input', async () => {
        const { normalizeDeltaSeconds } = await loadTimeUtils();

        expect(normalizeDeltaSeconds(0.016)).toBeCloseTo(0.016, 5);
    });

    test('normalizeDeltaSeconds rescales tiny deltas and warns', async () => {
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const { normalizeDeltaSeconds } = await loadTimeUtils();

        expect(normalizeDeltaSeconds(0.000016)).toBeCloseTo(0.016, 5);
        expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining('normalizing to seconds')
        );

        warnSpy.mockRestore();
    });
});
