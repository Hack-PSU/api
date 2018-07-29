const fs = require('fs');
const { logger } = require('../services/logging');

class MockStream {
  constructor() {
    this.s = fs.createReadStream('.dump_text', { encoding: 'utf-8' });
  }

  stream() {
    logger.info(`Streaming data : ${this.toString()}`);
    return this.s;
  }
}


module.exports = class MockConnection {
  /**
   *
   * @return {Promise<any>}
   */
  beginTransaction(callback) {
    logger.info('Starting transaction');
    this.noop();
    callback();
  }

  /**
   *
   * @return {Promise<any>}
   */
  rollback(callback) {
    logger.error('Rolling back');
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
    logger.info(`Query: ${query}\n Params: ${params}`);
    this.noop();
    return new MockStream();
  }

  release(callback) {
    logger.info('Connection released');
    this.noop();
    if (callback) {
      callback();
    }
  }

  commit(callback) {
    logger.info('Query committed.');
    this.noop();
    if (callback) {
      callback();
    }
  }

  noop() {
    return this;
  }
};

