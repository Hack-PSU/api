import { MysqlError, PoolConnection } from 'mysql';

/* eslint-disable no-underscore-dangle */
import * as streamify from 'stream-array';
import { HttpError } from '../../JSCommon/HttpError';
import { logger } from '../logging';
import { ICacheService } from './cache/cache';
import { MockConnection } from './mock_connection';
import { IQueryOpts, IUow } from './uow';

export enum SQL_ERRORS {
  DUPLICATE_KEY = 1062,
  FOREIGN_KEY_DELETE_FAILURE = 1217,
  FOREIGN_KEY_INSERT_FAILURE = 1452,
}

export class MysqlUow implements IUow {

  /**
   * Converts MySQL errors to HTTP Errors
   * @param {MysqlError} error
   */
  private static SQLErrorHandler(error: MysqlError) {
    if (error.errno === SQL_ERRORS.DUPLICATE_KEY) { // Duplicate key
      throw new HttpError(
        { message: 'duplicate objects not allowed', error }, 400);
    }
    if (error.errno === SQL_ERRORS.FOREIGN_KEY_INSERT_FAILURE) { // Foreign key validation failed
      throw new HttpError(
        { message: 'object depends on non-existent dependency', error }, 400);
    }
    if (error.errno === SQL_ERRORS.FOREIGN_KEY_DELETE_FAILURE) { // Foreign key validation failed
      throw new HttpError(
        { message: 'cannot delete as this object is referenced elsewhere', error }, 400);
    }
    // TODO: Handle other known SQL errors here
    throw error;
  }

  private readonly connection: PoolConnection;
  private readonly cacheService: ICacheService;

  /**
   *
   */
  constructor(connection: PoolConnection, cacheService: ICacheService) {
    this.connection = connection;
    this.cacheService = cacheService;
  }

  /**
   * @param query The query string to query with.
   * This function performs SQL escaping, so any substitutable parameters should be '?'s
   * @param params Parameters to substitute in the query
   * @param opts
   * @return {Promise<any>}
   */
  public query(
    query: string,
    params: any[] = [],
    opts: IQueryOpts = { stream: false, cache: false },
  ) {
    return new Promise(async (resolve, reject) => {
      if (opts.cache) { // Check cache
        try {
          const result = await this.cacheService.get(query);
          if (result != null) {
            if (opts.stream) {
              return resolve(streamify(result));
            }
            return resolve(result);
          }
        } catch (err) {
          // Error checking cache. Fallback silently.
          logger.error(err);
        }
      }
      this.connection.beginTransaction(() => {
        this.connection.query(query, params, (err, result) => {
          if (err) {
            this.connection.rollback();
            reject(err);
          }
          // Add result to cache
          this.cacheService.set(query, result)
            .catch((cacheError) => logger.error(cacheError));
          if (opts.stream) {
            return resolve(streamify(result));
          }
          return resolve(result);
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
