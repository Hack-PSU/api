const fs = require('fs');
const path = require('path');
const { logger } = require('../services/logging');

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
   * @param callback
   * @return {Promise<MockStream>}
   */
  query(query, params, callback) {
    logger.info(`Query: ${query}\n Params: ${JSON.stringify(params)}`);
    this.noop();
    return callback(null, Array.of(fs.readFileSync(path.join(__dirname, './dump_text'), 'utf-8')));
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

