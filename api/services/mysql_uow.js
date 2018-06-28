const { Readable } = require('stream');

module.exports = class MysqlUow {
  /**
   *
   * @param connection {MysqlCache}
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
      this.connection.query(query, params, (err, result) => {
        if (err) {
          console.error(err);
          reject(err[0]);
        } else if (opts && opts.stream) {
          const stream = new Readable({ objectMode: true });
          stream.push(result);
          stream.push(null);
          resolve(stream);
        } else {
          resolve(result);
        }
      });
    });
  }

  complete() {
    return Promise.resolve();
  }
};
