import { Inject, Injectable } from 'injection-js';
import { MysqlError, PoolConnection } from 'mysql';
import { defer, from, Observable } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import { HttpError } from '../../../JSCommon/errors';
import { Logger } from '../../logging/logging';
import { ICacheService } from '../cache/cache';
import { IConnectionFactory } from '../connection/connection-factory';
import { IQueryOpts, IUow } from './uow.service';

export enum SQL_ERRORS {
  DUPLICATE_KEY = 1062,
  PARSE_ERROR = 1064,
  SYNTAX_ERROR = 1149,
  FOREIGN_KEY_DELETE_FAILURE = 1217,
  FOREIGN_KEY_INSERT_FAILURE = 1452,
  BAD_NULL_ERROR = 1048,
  CONNECTION_REFUSED = 'ECONNREFUSED',
}

@Injectable()
export class MysqlUow implements IUow {

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
    opts: IQueryOpts = { cache: false },
  ) {
    return this.connectionPromise
      .pipe(
        mergeMap((connection: PoolConnection) => {
          return new Promise<T[]>(async (resolve, reject) => {
            if (opts.cache) { // Check cache
              try {
                const result: T[] = await this.cacheService.get(`${query}${(params as string[]).join('')}`);
                if (result !== null) {
                  this.complete(connection);
                  return resolve(result);
                }
              } catch (err) {
                // Error checking cache. Fallback silently.
                this.logger.error(err);
              }
            }
            connection.beginTransaction(() => {
              connection.query(query, params, (err: MysqlError, result: T[]) => {
                if (err) {
                  connection.rollback();
                  reject(err);
                }
                // Add result to cache
                this.cacheService.set(`${query}${(params as string[]).join('')}`, result)
                  .catch(cacheError => this.logger.error(cacheError));
                this.complete(connection);
                return resolve(result);
              });
            });
          });
        }),
        catchError((err: MysqlError) => {
          this.sqlErrorHandler(err);
          return from('');
        }),
      )
      .toPromise()
      // Gracefully convert MySQL errors to HTTP Errors
      .catch((err: MysqlError) => this.sqlErrorHandler(err));
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

  /**
   * Converts MySQL errors to HTTP Errors
   * @param {MysqlError} error
   */
  private sqlErrorHandler(error: MysqlError) {
    this.logger.error(error);
    switch (error.errno) {
      case SQL_ERRORS.PARSE_ERROR:
      case SQL_ERRORS.SYNTAX_ERROR:
        throw new HttpError(
          { message: 'the mysql query was ill-formed' }, 500);
      case SQL_ERRORS.DUPLICATE_KEY:
        throw new HttpError(
          { message: 'duplicate objects not allowed' }, 409);
      case SQL_ERRORS.FOREIGN_KEY_INSERT_FAILURE:
        throw new HttpError(
          { message: 'object depends on non-existent dependency' }, 400);
      case SQL_ERRORS.FOREIGN_KEY_DELETE_FAILURE:
        throw new HttpError(
          { message: 'cannot delete as this object is referenced elsewhere' }, 400);
      case SQL_ERRORS.CONNECTION_REFUSED:
        throw new HttpError(
          { message: 'could not connect to the database' }, 500);
      case SQL_ERRORS.BAD_NULL_ERROR:
        throw new HttpError(
          { message: 'a required property was found to be null' }, 400,
        );
    }
    // TODO: Handle other known SQL errors here
    throw error;
  }
}
