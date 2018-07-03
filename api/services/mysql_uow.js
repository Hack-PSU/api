const { Readable } = require('stream');

module.exports = class MysqlUow {
  /**
   *
   * @param connection {MysqlConnection}
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
    return this.connection.beginTransaction()
      .then(() => this.connection.query(query, params))
      .then((result) => {
        if (opts && opts.stream) {
          const stream = new Readable({ objectMode: true });
          stream.push(result);
          stream.push(null);
          return stream;
        }
        return result;
      });
  }

  complete() {
    return this.connection.release();
  }
};
