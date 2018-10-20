import { LoggingBunyan } from '@google-cloud/logging-bunyan';
import * as bunyan from 'bunyan';
import { Util } from '../JSCommon/util';

const loggingBunyan = new LoggingBunyan();

const LOGGER_NAME = 'hackpsu-api';

class Logger {
  public static instance() {
    return Util.readEnv('APP_ENV', 'debug') !== 'test' ?
      Logger.createStdLogger() : Logger.createTestLogger();
  }

  private static createStdLogger() {
    return bunyan.createLogger({
      level: 'info',
      name: LOGGER_NAME,
      streams: [
        // stdout logging
        { stream: process.stdout, level: 'info' },
        { stream: process.stderr, level: 'error' },
        // Stackdriver logging
        loggingBunyan.stream('info'),
      ],
    });
  }

  private static createTestLogger() {
    return bunyan.createLogger({
      level: 'trace',
      name: LOGGER_NAME,
      streams: [
        { path: './logs/debug', level: 'trace' },
        { path: './logs/error', level: 'error' },
      ],
    });
  }
}

export const logger = Logger.instance();
