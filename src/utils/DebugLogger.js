// src/utils/DebugLogger.js

export class DebugLogger {
  constructor(maxLogs = 100) {
    this.enabled = process.env.NODE_ENV === 'development';
    this.logs = [];
    this.maxLogs = maxLogs;
  }

  static instance = null;

  static getInstance(maxLogs = 100) {
    if (!DebugLogger.instance) {
      DebugLogger.instance = new DebugLogger(maxLogs);
    }
    return DebugLogger.instance;
  }

  log(message, category = 'General', data = null) {
    if (!this.enabled) return;

    const entry = {
      timestamp: new Date().toISOString(),
      category,
      message,
      data
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    console.log(`[${category}]`, message, data || '');
  }

  error(message, error = null, data = null) {
    if (!this.enabled) return;

    const entry = {
      timestamp: new Date().toISOString(),
      category: 'Error',
      message,
      error: error?.stack || '',
      data
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    console.error('[Error]', message, error, data || '');
  }

  getErrors() {
    return [...this.logs];
  }

  clearErrors() {
    this.logs = [];
  }
}
