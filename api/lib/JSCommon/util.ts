import { Provider, ReflectiveInjector } from 'injection-js';
import * as Stringify from 'streaming-json-stringify';
import { HttpError } from './errors';

export class Util {
  public static readEnv(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
  }

  public static getCurrentEnv(): Environment {
    switch (this.readEnv('APP_ENV', '')) {
      case 'PROD': return Environment.PRODUCTION;
      case 'STAGING': return Environment.STAGING;
      case 'TEST': return Environment.TEST;
      default: throw new Error('Invalid environment variable read');
    }
  }

  public static errorHandler500(err, handler) {
    const error = new HttpError(err.message || err, 500);
    handler(error);
  }

  public static standardErrorHandler(err, handler) {
    const error = new HttpError(err.message || err, err.status || 500);
    handler(error);
  }

  public static streamHandler(stream, res, next) {
    stream.pipe(Stringify())
      .pipe(res.type('json').status(200))
      .on('end', res.end)
      .on('error', err => errorHandler500(err, next));
  }

  /**
   * Normalize a port into a number, string, or false.
   * @param val {number | string} The port
   * @return {string | number | boolean}
   */
  public static normalizePort(val: string) {
    const port = parseInt(val, 10);
    if (isNaN(port)) {
      // named pipe
      return val;
    }
    if (port >= 0) {
      // port number
      return port;
    }
    return false;
  }

  /**
   * Returns an instance from the Dependency Framework of the
   * requested type.
   */
  public static getInstance(type: Provider[]) {
    return ReflectiveInjector.resolveAndCreate(type).get(type);
  }
}

export enum Environment {
  STAGING,
  TEST,
  PRODUCTION,
  DEBUG,
}
