import { Injectable } from 'injection-js';
import { MysqlError, PoolConnection } from 'mysql';

/* eslint-disable no-underscore-dangle */
import { Stream } from 'stream';
import * as streamify from 'stream-array';
import { HttpError } from '../../../JSCommon/errors';
import { logger } from '../../logging/logging';
import { ICacheService } from '../cache/cache';
import { IQueryOpts, IUow } from './uow.service';

export enum SQL_ERRORS {
  DUPLICATE_KEY = 1062,
  FOREIGN_KEY_DELETE_FAILURE = 1217,
  FOREIGN_KEY_INSERT_FAILURE = 1452,
}

@Injectable()
export class MysqlUow implements IUow {

  /**
   * Converts MySQL errors to HTTP Errors
   * @param {MysqlError} error
   */
  private static SQLErrorHandler(error: MysqlError) {
    switch (error.errno) {
      case SQL_ERRORS.DUPLICATE_KEY:
        throw new HttpError(
          { message: 'duplicate objects not allowed', error }, 400);
      case SQL_ERRORS.FOREIGN_KEY_INSERT_FAILURE:
        throw new HttpError(
          { message: 'object depends on non-existent dependency', error }, 400);
      case SQL_ERRORS.FOREIGN_KEY_DELETE_FAILURE:
        throw new HttpError(
          { message: 'cannot delete as this object is referenced elsewhere', error }, 400);
    }
    // TODO: Handle other known SQL errors here
    throw error;
  }

  /**
   *
   */
  constructor(private connection: PoolConnection, private cacheService: ICacheService) {}

  /**
   * @param query The query string to query with.
   * This function performs SQL escaping, so any substitutable parameters should be '?'s
   * @param params Parameters to substitute in the query
   * @param opts
   * @return {Promise<any>}
   */
  public query<T>(
    query: string,
    params: any[] = [],
    opts: IQueryOpts = { stream: false, cache: false },
  ) {
    return new Promise<T | Stream>(async (resolve, reject) => {
      if (opts.cache) { // Check cache
        try {
          const result: T = await this.cacheService.get(query);
          if (result !== null) {
            if (opts.stream) {
              resolve(streamify(result));
              return;
            }
            resolve(result);
            return;
          }
        } catch (err) {
          // Error checking cache. Fallback silently.
          logger.error(err);
        }
      }
      this.connection.beginTransaction(() => {
        this.connection.query(query, params, (err: MysqlError, result: T) => {
          if (err) {
            this.connection.rollback();
            reject(err);
            return;
          }
          // Add result to cache
          this.cacheService.set(query, result)
            .catch((cacheError) => logger.error(cacheError));
          if (opts.stream) {
            resolve(streamify(result));
            return;
          }
          resolve(result);
          return;
        });
      });
    })
    // Gracefully convert MySQL errors to HTTP Errors
      .catch((err: MysqlError) => MysqlUow.SQLErrorHandler(err));
  }

  public commit() {
    return new Promise((resolve) => {
      this.connection.commit(() => {
        resolve(null);
      });
    });
  }

  public complete() {
    return new Promise((resolve) => {
      this.connection.commit(() => {
        this.connection.release();
        resolve(null);
      });
    });
  }
}
