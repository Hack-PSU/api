/* eslint-disable no-underscore-dangle */


module.exports = class MySQLConnection {
  /**
   *
   */
  constructor() {
    this._connection = null;
  }

  _connect() {
    return connectAsync((connection) => {
      this._connection = connection;
    });
  }

  /**
   *
   * @returns {PoolConnection}
   */
  get connection() {
    return this._connection;
  }

  /**
   *
   * @return {Promise<any>}
   */
  beginTransaction() {
    let promise;
    if (!this.connection) {
      promise = this._connect();
    } else {
      promise = Promise.resolve();
    }
    return promise
      .then(() => this.connection.beginTransaction());
  }

  /**
   *
   * @param query
   * @param params
   * @return {Promise<any>}
   */
  query(query, params) {
    return new Promise((resolve, reject) => {
      this.connection.query(query, params, (err, rows) => {
        if (err) {
          return reject(err);
        }
        return resolve(rows);
      });
    });
  }

  release() {
    return Promise.resolve();
  }
};

