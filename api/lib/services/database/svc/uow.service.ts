import * as squel from 'squel';

/**
 * A wrapper around connecting to a database backend. Performs "one unit of work" with each call.
 *  In theory, implementations are transaction based and will
 * rollback the query results on failures.
 *
 * Some Implementations such as {@link RtdbUow} do not support rolling back
 * transactions
 */
export interface IUow {
  /**
   * Perform a single query with the underlying database
   * Ideally this function should start a transaction that
   * allows rolling back in case of failures
   * @param {string} query Description of what action to perform
   * @param {string | string[]} params Parameters to execute query
   * @param {IQueryOpts} opts Options to modify behavior
   * @returns {Promise<any>}
   */
  query(query: string | number, params: string | string[], opts: IQueryOpts): Promise<any>;

  /**
   * Commit a previously started transaction to the database.
   * Does nothing if a transaction is not active
   * @returns {Promise<any>}
   */
  commit(): Promise<any>;

  /**
   * Commits a previously started transaction to the database
   * and perform any cleanup as needed
   * @returns {Promise<any>}
   */
  complete(): Promise<any>;
}

export interface IUowOpts {
  fields?: string[];
  query?: squel.ParamString;
  startAt?: number;
  count?: number;
  currentHackathon?: boolean,
}

export interface IQueryOpts {
  stream?: boolean;
  cache?: boolean;
}
