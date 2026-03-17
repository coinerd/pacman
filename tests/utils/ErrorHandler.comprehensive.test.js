/**
 * Comprehensive tests for ErrorHandler
 * Tests edge cases and error handling scenarios
 */

import { ErrorHandler } from '../../src/utils/ErrorHandler.js';

describe('ErrorHandler Comprehensive', () => {
    let handler;
    let originalDispatchEvent;

    beforeEach(() => {
        // Reset singleton between tests
        ErrorHandler.instance = null;
        handler = new ErrorHandler();
        handler.clearErrors();
        originalDispatchEvent = window.dispatchEvent;
        window.dispatchEvent = jest.fn();
    });

    afterEach(() => {
        window.dispatchEvent = originalDispatchEvent;
        handler.clearErrors();
        ErrorHandler.instance = null;
    });

    describe('getInstance', () => {
        test('should create new instance if none exists', () => {
            ErrorHandler.instance = null;
            const instance = ErrorHandler.getInstance();
            expect(instance).toBeInstanceOf(ErrorHandler);
        });

        test('should return existing instance', () => {
            const instance1 = ErrorHandler.getInstance();
            const instance2 = ErrorHandler.getInstance();
            expect(instance1).toBe(instance2);
        });
    });

    describe('log', () => {
        test('should store error info with message and stack', () => {
            const error = new Error('Test error');
            error.stack = 'test stack';
            handler.log(error, { testContext: true });

            const errors = handler.getErrors();
            expect(errors).toHaveLength(1);
            expect(errors[0].message).toBe('Test error');
            expect(errors[0].stack).toBe('test stack');
            expect(errors[0].context).toEqual({ testContext: true });
        });

        test('should limit errors to 100 entries', () => {
            for (let i = 0; i < 110; i++) {
                handler.log(new Error(`Error ${i}`));
            }

            const errors = handler.getErrors();
            expect(errors).toHaveLength(100);
            // Oldest errors should be removed
            expect(errors[0].message).toBe('Error 10');
        });

        test('should shift oldest error when limit reached', () => {
            for (let i = 0; i < 101; i++) {
                handler.log(new Error(`Error ${i}`));
            }

            const errors = handler.getErrors();
            expect(errors[0].message).toBe('Error 1');
        });
    });

    describe('wrap', () => {
        test('should return result of successful function', () => {
            const fn = (a, b) => a + b;
            const wrapped = handler.wrap(fn);

            const result = wrapped(5, 3);
            expect(result).toBe(8);
        });

        test('should log error when wrapped function throws', () => {
            const errorFn = () => { throw new Error('Function error'); };
            const wrapped = handler.wrap(errorFn, { name: 'context' }, 'Custom error message');

            wrapped();

            const errors = handler.getErrors();
            expect(errors).toHaveLength(1);
            expect(errors[0].message).toBe('Function error');
        });

        test('should handle function with no name', () => {
            const anonFn = function() { throw new Error('Anon error'); };
            const wrapped = handler.wrap(anonFn);

            wrapped();

            const errors = handler.getErrors();
            expect(errors).toHaveLength(1);
        });

        test('should handle empty errorMessage', () => {
            const errorFn = () => { throw new Error('Test'); };
            const wrapped = handler.wrap(errorFn, null, '');

            const result = wrapped();
            expect(result).toBeNull();
        });
    });

    describe('assert', () => {
        test('should throw error with message', () => {
            expect(() => {
                handler.assert(false, 'Test assertion');
            }).toThrow('Assertion failed: Test assertion');
        });

        test('should log assertion failure', () => {
            try {
                handler.assert(false, 'Test assertion');
            } catch {
                // Expected
            }

            const errors = handler.getErrors();
            expect(errors).toHaveLength(1);
            expect(errors[0].message).toBe('Assertion failed: Test assertion');
        });
    });

    describe('clearErrors', () => {
        test('should clear all errors', () => {
            handler.log(new Error('Error 1'));
            handler.log(new Error('Error 2'));
            expect(handler.getErrors()).toHaveLength(2);

            handler.clearErrors();
            expect(handler.getErrors()).toHaveLength(0);
        });
    });

    describe('getErrors', () => {
        test('should return copy of errors array', () => {
            handler.log(new Error('Test'));
            const errors1 = handler.getErrors();
            const errors2 = handler.getErrors();

            expect(errors1).not.toBe(errors2); // Different array references
            expect(errors1).toEqual(errors2); // Same content
        });
    });

    describe('error limit behavior', () => {
        test('should handle exactly 100 errors', () => {
            for (let i = 0; i < 100; i++) {
                handler.log(new Error(`Error ${i}`));
            }

            const errors = handler.getErrors();
            expect(errors).toHaveLength(100);
            expect(errors[0].message).toBe('Error 0');
            expect(errors[99].message).toBe('Error 99');
        });

        test('should handle 101 errors by removing first', () => {
            for (let i = 0; i < 101; i++) {
                handler.log(new Error(`Error ${i}`));
            }

            const errors = handler.getErrors();
            expect(errors).toHaveLength(100);
            expect(errors[0].message).toBe('Error 1');
        });
    });
});
