module.exports = class MockConnection {
  /**
   *
   * @return {Promise<any>}
   */
  beginTransaction(callback) {
    console.log('Starting transaction');
    this.noop();
    callback();
  }

  /**
   *
   * @return {Promise<any>}
   */
  rollback(callback) {
    console.error('Rolling back');
    this.noop();
    callback();
  }

  /**
   *
   * @param query
   * @param params
   * @return {Stream}
   */
  query(query, params) {
    console.log(`Query: ${query}\n Params: ${params}`);
    this.noop();
    return process.stdout; // TODO: Change to object that has .stream() as property
  }

  commit(callback) {
    console.log('Committing');
    this.noop();
    callback();
  }

  release(callback) {
    console.log('Connection released');
    this.noop();
    if (callback) {
      callback();
    }
  }

  noop() {
    return this;
  }
};
