import { express } from '@google-cloud/logging-bunyan';
import * as bunyan from 'bunyan';
import { Request } from 'express';
import { Injectable } from 'injection-js';
import 'reflect-metadata';

// const loggingBunyan = new LoggingBunyan();

const LOGGER_NAME = 'hackpsu-api';

@Injectable()
export class Logger {

  public bunyan: bunyan;
  private request?: any;

  constructor() {
    this.bunyan = bunyan.createLogger({
      name: LOGGER_NAME,
      streams: [
        // stdout logging
        { stream: process.stdout, level: 'info' },
        { stream: process.stderr, level: 'error' },
      ],
    });
  }

  public async mw() {
    const { mw } = await express.middleware({
      level: 'info',
      logName: LOGGER_NAME,
    });
    return mw;
  }

  public setContext(request: Request) {
    this.request = request;
  }

  public debug(message: any) {
    if (this.request) {
      this.request.log.debug(message);
    }
    this.bunyan.debug(message);
  }

  public info(message: any) {
    if (this.request) {
      this.request.log.info(message);
    }
    this.bunyan.info(message);
  }

  public error(message: any) {
    if (this.request) {
      this.request.log.error(message);
    }
    this.bunyan.error(message);
  }

  public warn(message: any) {
    if (this.request) {
      this.request.log.warn(message);
    }
    this.bunyan.warn(message);
  }

  // private static createStdLogger() {
  //   return bunyan.createLogger({
  //     level: 'info',
  //     name: LOGGER_NAME,
  //     streams: [
  //       // stdout logging
  //       { stream: process.stdout, level: 'info' },
  //       { stream: process.stderr, level: 'error' },
  //       // Stackdriver logging
  //       loggingBunyan.stream('info'),
  //     ],
  //   });
  // }
  //
  // private static createTestLogger() {
  //   return bunyan.createLogger({
  //     level: 'trace',
  //     name: LOGGER_NAME,
  //     streams: [
  //       { path: './logs/debug', level: 'trace' },
  //       { path: './logs/error', level: 'error' },
  //     ],
  //   });
  // }
}

// RootInjector.registerProvider([{ provide: 'BunyanLogger', useClass: Logger }]);
// export const logger = RootInjector.getInjector().get('BunyanLogger').bunyan;
