// src/utils/ErrorHandler.js

export class ErrorHandler {
    constructor() {
        this.errors = [];
        this.isDevelopment = process.env.NODE_ENV === 'development';
    }

    static instance = null;

    static getInstance() {
        if (!ErrorHandler.instance) {
            ErrorHandler.instance = new ErrorHandler();
        }
        return ErrorHandler.instance;
    }

    log(error, context = {}) {
        const errorInfo = {
            message: error.message,
            stack: error.stack,
            context,
            timestamp: new Date().toISOString()
        };

        this.errors.push(errorInfo);
        console.error('[ErrorHandler]', errorInfo);

        if (this.isDevelopment) {
            const event = new CustomEvent('game-error', {
                detail: { message: error.message }
            });
            window.dispatchEvent(event);
        }
    }

    wrap(fn, context = null, errorMessage = 'An error occurred') {
        return (...args) => {
            try {
                return fn.apply(context, args);
            } catch (error) {
                this.log(error, { function: fn.name, args, context });
                if (errorMessage) {
                    if (this.isDevelopment) {
                        const event = new CustomEvent('game-error', {
                            detail: { message: errorMessage }
                        });
                        window.dispatchEvent(event);
                    }
                }
                return null;
            }
        };
    }

    assert(condition, message) {
        if (!condition) {
            const error = new Error(`Assertion failed: ${message}`);
            this.log(error);
            throw error;
        }
    }

    getErrors() {
        return [...this.errors];
    }

    clearErrors() {
        this.errors = [];
    }
}
