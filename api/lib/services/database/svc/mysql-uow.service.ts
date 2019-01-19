import { Inject, Injectable } from 'injection-js';
import { MysqlError, PoolConnection } from 'mysql';
import { defer, from, Observable } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { ReadableStream, Stream } from 'ts-stream';
import { HttpError } from '../../../JSCommon/errors';
import { Logger } from '../../logging/logging';
import { ICacheService } from '../cache/cache';
import { IConnectionFactory } from '../connection/connection-factory';
import { IQueryOpts, IUow } from './uow.service';

export enum SQL_ERRORS {
  DUPLICATE_KEY = 1062,
  FOREIGN_KEY_DELETE_FAILURE = 1217,
  FOREIGN_KEY_INSERT_FAILURE = 1452,
  CONNECTION_REFUSED = 'ECONNREFUSED',
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
      case SQL_ERRORS.CONNECTION_REFUSED:
        throw new HttpError(
          { message: 'could not connect to the database', error }, 500);
    }
    // TODO: Handle other known SQL errors here
    throw error;
  }

  private connectionPromise: Observable<PoolConnection>;

  /**
   *
   */
  constructor(
    @Inject('IConnectionFactory') private connectionFactory: IConnectionFactory,
    @Inject('ICacheService') private cacheService: ICacheService,
    @Inject('BunyanLogger') private logger: Logger,
  ) {
    this.connectionPromise = defer<PoolConnection>(() => this.connectionFactory.getConnection())
      .pipe(
        catchError((error) => {
          this.logger.error(error);
          throw error;
        }),
      );
  }

  /**
   * @param query The query string to query with.
   * This function performs SQL escaping, so any substitutable parameters should be '?'s
   * @param params Parameters to substitute in the query
   * @param opts
   * @return {Promise<any>}
   */
  public query<T>(
    query: string,
    params: string | string[] = [],
    opts: IQueryOpts = { stream: false, cache: false },
  ) {
    return this.connectionPromise
      .pipe(
        switchMap((connection: PoolConnection) => {
          return from(new Promise<T | ReadableStream<T>>(async (resolve, reject) => {
            if (opts.cache) { // Check cache
              try {
                const result: T = await this.cacheService.get(query);
                if (result !== null) {
                  if (opts.stream) {
                    this.complete(connection);
                    return resolve(Stream.from<T>([result]));
                  }
                  this.complete(connection);
                  return resolve(result);
                }
              } catch (err) {
                // Error checking cache. Fallback silently.
                this.logger.error(err);
              }
            }
            connection.beginTransaction(() => {
              connection.query(query, params, (err: MysqlError, result: T) => {
                if (err) {
                  connection.rollback();
                  throw err;
                }
                // Add result to cache
                this.cacheService.set(query, result)
                  .catch((cacheError) => this.logger.error(cacheError));
                if (opts.stream) {
                  this.complete(connection);
                  return resolve(Stream.from([result]));
                }
                this.complete(connection);
                return resolve(result);
              });
            });
          }));
        }),
        catchError((err: MysqlError) => {
          MysqlUow.SQLErrorHandler(err);
          return from('');
        }),
      )
      .toPromise()
      // Gracefully convert MySQL errors to HTTP Errors
      .catch((err: MysqlError) => MysqlUow.SQLErrorHandler(err));
  }

  public commit(connection: PoolConnection) {
    return new Promise<any>((resolve) => {
      connection.commit(() => {
        return resolve(null);
      });
    });
  }

  public complete(connection: PoolConnection) {
    return new Promise<any>((resolve) => {
      connection.commit(() => {
        connection.release();
        return resolve(null);
      });
    });

  }
}
