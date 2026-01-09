/**
 * Movement Logger
 * Logs detailed movement information with stack traces for debugging
 */

class MovementLogger {
    constructor(entityName, logDir = './logs') {
        this.entityName = entityName;
        this.logDir = logDir;
        this.logs = [];
        this.enabled = true;
        console.log(`[MovementLogger] Initialized logger for ${entityName}`);
    }

    /**
     * Get stack trace string
     * @param {number} depth - Number of frames to skip
     * @returns {string} Stack trace
     */
    getStackTrace(depth = 3) {
        const stack = new Error().stack;
        const lines = stack.split('\n').slice(depth);
        return lines.join('\n');
    }

    /**
     * Log a message with timestamp and stack trace
     * @param {string} message - Log message
     * @param {Object} data - Additional data to log
     * @param {boolean} includeStackTrace - Whether to include stack trace
     */
    log(message, data = {}, includeStackTrace = true) {
        if (!this.enabled) {
            return;
        }

        const timestamp = new Date().toISOString();
        const timeMs = Date.now();
        let logEntry = `[${timestamp}] [${timeMs}] [${this.entityName}] ${message}`;

        if (Object.keys(data).length > 0) {
            console.log(logEntry, data);
        } else {
            console.log(logEntry);
        }

        if (includeStackTrace) {
            console.log('Stack trace:', this.getStackTrace());
        }

        this.logs.push({
            timestamp,
            timeMs,
            message,
            data,
            stackTrace: includeStackTrace ? this.getStackTrace() : null
        });
    }

    /**
     * Export logs to file (save to localStorage for download)
     */
    exportToFile() {
        const fileName = `${this.entityName.toLowerCase()}_movement_${Date.now()}.log`;
        const content = this.logs.map(entry =>
            `[${entry.timestamp}] ${entry.message}\n` +
            (Object.keys(entry.data || {}).length > 0 ? `  Data: ${JSON.stringify(entry.data)}\n` : '') +
            (entry.stackTrace ? `  Stack: ${entry.stackTrace}\n` : '')
        ).join('\n');

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);

        console.log(`[MovementLogger] Exported ${this.logs.length} log entries to ${fileName}`);
    }

    /**
     * Log direction change
     * @param {string} from - Previous direction
     * @param {string} to - New direction
     * @param {Object} context - Additional context
     */
    logDirectionChange(from, to, context = {}) {
        this.log(`DIRECTION CHANGE: ${from} -> ${to}`, {
            direction: to,
            previousDirection: from,
            ...context
        });
    }

    /**
     * Log position update
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} gridX - Grid X position
     * @param {number} gridY - Grid Y position
     * @param {Object} context - Additional context
     */
    logPositionUpdate(x, y, gridX, gridY, context = {}) {
        this.log(`POSITION UPDATE: (${x.toFixed(2)}, ${y.toFixed(2)}) grid: (${gridX}, ${gridY})`, {
            position: { x: x.toFixed(2), y: y.toFixed(2) },
            gridPosition: { x: gridX, y: gridY },
            ...context
        });
    }

    /**
     * Log movement attempt
     * @param {string} direction - Movement direction
     * @param {boolean} isMoving - Whether entity is moving
     * @param {number} speed - Current speed
     * @param {number} delta - Delta time
     * @param {Object} context - Additional context
     */
    logMovementAttempt(direction, isMoving, speed, delta, context = {}) {
        this.log(`MOVEMENT ATTEMPT: dir=${direction}, moving=${isMoving}, speed=${speed.toFixed(2)}, delta=${delta}`, {
            direction,
            isMoving,
            speed: speed.toFixed(2),
            delta: delta.toFixed(2),
            ...context
        });
    }

    /**
     * Log center detection
     * @param {boolean} isAtCenter - Whether at tile center
     * @param {number} gridX - Grid X
     * @param {number} gridY - Grid Y
     * @param {number} distance - Distance to center
     * @param {Object} context - Additional context
     */
    logCenterDetection(isAtCenter, gridX, gridY, distance, context = {}) {
        this.log(`CENTER DETECTION: ${isAtCenter ? 'AT CENTER' : 'NOT AT CENTER'} grid:(${gridX}, ${gridY}) dist=${distance.toFixed(2)}`, {
            isAtCenter,
            gridPosition: { x: gridX, y: gridY },
            distanceToCenter: distance.toFixed(2),
            ...context
        });
    }

    /**
     * Log state change
     * @param {string} state - State name
     * @param {any} value - State value
     * @param {Object} context - Additional context
     */
    logStateChange(state, value, context = {}) {
        this.log(`STATE CHANGE: ${state} = ${JSON.stringify(value).substring(0, 100)}`, {
            state,
            value,
            ...context
        });
    }

    /**
     * Log error
     * @param {string} message - Error message
     * @param {Error} error - Error object
     * @param {Object} context - Additional context
     */
    logError(message, error = null, context = {}) {
        this.log(`ERROR: ${message}`, {
            error: error ? error.message : 'No error object',
            stack: error ? error.stack : 'No stack trace',
            ...context
        });
    }
}

export default MovementLogger;
