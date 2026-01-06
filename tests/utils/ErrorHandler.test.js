// tests/utils/ErrorHandler.test.js

import { ErrorHandler } from '../../src/utils/ErrorHandler.js';

describe('ErrorHandler', () => {
    let handler;
    let windowSpy;

    beforeEach(() => {
        handler = new ErrorHandler();
        windowSpy = jest.spyOn(window, 'dispatchEvent');
    });

    afterEach(() => {
        windowSpy.mockRestore();
    });

    describe('singleton pattern', () => {
        test('should return same instance', () => {
            const h1 = ErrorHandler.getInstance();
            const h2 = ErrorHandler.getInstance();
            expect(h1).toBe(h2);
        });
    });

    describe('error logging', () => {
        test('should log error with timestamp', () => {
            const error = new Error('Test error');
            handler.log(error, { context: 'test' });

            const errors = handler.getErrors();
            expect(errors).toHaveLength(1);
            expect(errors[0].message).toBe('Test error');
            expect(errors[0].timestamp).toBeDefined();
        });

        test('should dispatch custom event in development mode', () => {
            process.env.NODE_ENV = 'development';
            const devHandler = new ErrorHandler();

            devHandler.log(new Error('Test error'));

            expect(windowSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'game-error'
                })
            );
        });
    });

    describe('function wrapping', () => {
        test('should catch errors and return null', () => {
            const errorFn = () => { throw new Error('Wrapped error'); };
            const wrapped = handler.wrap(errorFn);

            const result = wrapped();

            expect(result).toBeNull();
        });

        test('should pass through arguments', () => {
            const fn = jest.fn((a, b) => a + b);
            const wrapped = handler.wrap(fn);

            const result = wrapped(3, 4);

            expect(fn).toHaveBeenCalledWith(3, 4);
        });

        test('should use provided context', () => {
            const context = { name: 'TestContext' };
            const fn = jest.fn(function() { return this.name; });
            const wrapped = handler.wrap(fn, context);

            const result = wrapped();

            expect(result).toBe('TestContext');
        });
    });

    describe('assertions', () => {
        test('should throw on failed assertion', () => {
            expect(() => {
                handler.assert(false, 'Should be true');
            }).toThrow('Assertion failed: Should be true');
        });

        test('should not throw on passing assertion', () => {
            expect(() => {
                handler.assert(true, 'Should be true');
            }).not.toThrow();
        });
    });
});
