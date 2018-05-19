module.exports = class MysqlUow {
  /**
   *
   * @param connection {Connection}
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
    return new Promise((resolve, reject) => {
      this.connection.beginTransaction((err1) => {
        if (err1) {
          this.connection.rollback(() => reject(err1));
        } else if (opts && opts.stream) {
          resolve(this.connection.query(query, params).stream());
        } else {
          this.connection.query(query, params, (err2, result) => {
            if (err2) {
              this.connection.rollback(() => reject(err2));
            } else {
              resolve(result);
            }
          });
        }
      });
    });
  }

  complete() {
    return new Promise((resolve, reject) => {
      this.connection.commit((err) => {
        if (err) this.connection.rollback(() => reject(err));
        else {
          this.connection.release();
          resolve();
        }
      });
    });
  }
};
