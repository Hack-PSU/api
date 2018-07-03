/* eslint-disable no-underscore-dangle */
module.exports = class MySQLConnection {
  get connection() {
    return this._connection;
  }

  /**
   *
   * @param connection {MysqlCache}
   */
  constructor(connection) {
    this._connection = connection;
  }

  /**
   *
   * @return {Promise<any>}
   */
  beginTransaction() {
    return this.connection.connectAsync();
  }

  /**
   *
   * @param query
   * @param params
   * @return {Promise<any>}
   */
  query(query, params) {
    return this.connection.queryAsync(query, params);
  }

  release() {
    // Resolve directly as 'mysql-cache' handles clearing the pool
    return Promise.resolve();
  }

  get dbConnection() {
    return this.connection;
  }
};

