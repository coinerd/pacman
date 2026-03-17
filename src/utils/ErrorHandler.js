// src/utils/ErrorHandler.js

// Helper to safely check import.meta.env - uses eval to avoid parse-time errors
function getIsDevelopment() {
    // Check for Vite's import.meta.env using eval to prevent parse errors in Jest
    try {
        const hasImportMeta = eval('typeof import.meta !== "undefined"');
        if (hasImportMeta) {
            const isDev = eval('import.meta.env?.DEV === true');
            if (isDev) {return true;}
        }
    } catch {
        // import.meta not available or not accessible
    }

    // Fallback checks
    return (typeof window !== 'undefined' && window.location?.hostname === 'localhost')
        || (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development');
}

export class ErrorHandler {
    constructor() {
        this.errors = [];
        // Browser-compatible environment detection
        // Uses import.meta.env for Vite, falls back to window check for other environments
        this.isDevelopment = getIsDevelopment();
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

        // Prevent memory leak by limiting errors array to 100 entries
        if (this.errors.length >= 100) {
            this.errors.shift(); // Remove oldest error
        }

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
