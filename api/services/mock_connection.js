const fs = require('fs');

class MockStream {
  constructor() {
    this.s = fs.createReadStream('.dump_text', { encoding: 'utf-8' });
  }

  stream() {
    console.log(`Streaming data :P ${this.toString()}`);
    return this.s;
  }
}


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
   * @return {MockStream}
   */
  query(query, params) {
    console.log(`Query: ${query}\n Params: ${params}`);
    this.noop();
    return new MockStream();
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

