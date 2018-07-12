/* eslint-disable no-underscore-dangle */
const Mysqlcache = require('mysql-cache');
const { sqlConnection } = require('../assets/constants/constants');

if (process.env.INSTANCE_CONNECTION_NAME && process.env.NODE_ENV === 'production') {
  sqlConnection.host = '';
} else {
  sqlConnection.socketPath = '';
}

const mySqlCacheConnection = new Mysqlcache(sqlConnection);

module.exports = class MySQLConnection {
  /**
   *
   * @param connection {MysqlCache}
   */
  constructor() {
    this._connection = mySqlCacheConnection;
  }

  /**
   *
   * @returns {Mysqlcache|MysqlCache}
   */
  get connection() {
    return this._connection;
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

  get hits() {
    return this.connection.hits;
  }

  get misses() {
    return this.connection.misses;
  }
};

