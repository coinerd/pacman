/**
 * AudioContext Mock for testing
 */

export function createMockAudioContext() {
    const buffers = [];
    const sources = [];
    const gains = [];

    return {
        sampleRate: 44100,
        currentTime: 0,
        destination: { connect: jest.fn() },

        createBuffer: jest.fn((channels, length, sampleRate) => {
            const buffer = {
                numberOfChannels: channels,
                length,
                sampleRate,
                duration: length / sampleRate,
                getChannelData: jest.fn(() => new Float32Array(length))
            };
            buffers.push(buffer);
            return buffer;
        }),

        createBufferSource: jest.fn(() => {
            const source = {
                buffer: null,
                connect: jest.fn(),
                start: jest.fn(),
                stop: jest.fn(),
                onended: null
            };
            sources.push(source);
            return source;
        }),

        createGain: jest.fn(() => {
            const gain = {
                gain: {
                    setValueAtTime: jest.fn(),
                    exponentialRampToValueAtTime: jest.fn(),
                    linearRampToValueAtTime: jest.fn(),
                    value: 1
                },
                connect: jest.fn()
            };
            gains.push(gain);
            return gain;
        }),

        createOscillator: jest.fn(() => ({
            type: 'sine',
            frequency: {
                setValueAtTime: jest.fn(),
                exponentialRampToValueAtTime: jest.fn(),
                linearRampToValueAtTime: jest.fn(),
                value: 440
            },
            connect: jest.fn(),
            start: jest.fn(),
            stop: jest.fn()
        })),

        createBiquadFilter: jest.fn(() => ({
            type: 'lowpass',
            frequency: { setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn(), value: 1000 },
            Q: { value: 1, setValueAtTime: jest.fn() },
            connect: jest.fn()
        })),

        createScriptProcessor: jest.fn((bufferSize, inputChannels, outputChannels) => ({
            bufferSize,
            connect: jest.fn(),
            onaudioprocess: null
        })),

        // Helpers for testing
        _buffers: buffers,
        _sources: sources,
        _gains: gains
    };
}
