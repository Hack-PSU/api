/* eslint-disable no-underscore-dangle */
const streamify = require('stream-array');


module.exports = class MysqlUow {
  /**
   *
   */
  constructor(connection) {
    this.connection = connection;
  }

  /**
   * @param query
   * @param params
   * @param opts
   * @return {Promise<any>}
   */
  query(query, params, opts) { // command
    if (!params) {
      params = {};
    }
    return new Promise((resolve, reject) => {
      this.connection.beginTransaction(() => {
        this.connection.query(query, params, (err, result) => {
          if (err) {
            this.connection.rollback();
            reject(err);
          }
          if (opts && opts.stream) {
            return resolve(streamify(result));
          }
          return resolve(result);
        });
      });
    });
  }

  complete() {
    return new Promise((resolve) => {
      this.connection.commit(() => {
        this.connection.release();
        resolve(null);
      });
    });
  }
};
