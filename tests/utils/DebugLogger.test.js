// tests/utils/DebugLogger.test.js

import { DebugLogger } from '../../src/utils/DebugLogger.js';

describe('DebugLogger', () => {
  let logger;
  let consoleSpy;

  beforeEach(() => {
    process.env.NODE_ENV = 'development';
    logger = new DebugLogger();
    consoleSpy = jest.spyOn(console, 'log');
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('initialization', () => {
    test('should create singleton instance', () => {
      const logger1 = DebugLogger.getInstance();
      const logger2 = DebugLogger.getInstance();
      expect(logger1).toBe(logger2);
    });
  });

  describe('logging behavior', () => {
    test('should log to console in development mode', () => {
      logger.log('Test message', 'TestCategory');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TestCategory]'),
        'Test message',
        ''
      );
    });

    test('should not log in production mode', () => {
      process.env.NODE_ENV = 'production';
      const prodLogger = new DebugLogger();

      prodLogger.log('Test message');

      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    test('should log errors with stack trace', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      const error = new Error('Test error');
      logger.error('Something failed', error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Error]',
        'Something failed',
        error,
        ''
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('log management', () => {
    test('should limit log entries to maxLogs', () => {
      const loggerInstance = new DebugLogger(3);

      for (let i = 0; i < 10; i++) {
        loggerInstance.log(`Message ${i}`);
      }

      expect(loggerInstance.getErrors().length).toBeLessThanOrEqual(3);
    });

    test('should clear logs when requested', () => {
      logger.log('First log');
      logger.log('Second log');
      logger.clearErrors();

      expect(logger.getErrors()).toHaveLength(0);
    });
  });
});
