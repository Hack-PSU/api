/* eslint-disable class-methods-use-this */
const BaseObject = require('./BaseObject');

const TABLE_NAME = 'ATTENDANCE';

module.exports = TABLE_NAME;

module.exports = class Attendance extends BaseObject {
  constructor(data, uow) {
    super(uow);
  }

  static generateTestData() {
    throw new Error('This method is not supported by this class');
  }

  /**
   *
   * @param uow
   * @param opts
   * @return {Promise<Stream>}
   */
  static getAll(uow, opts) {
    return super.getAll(uow, TABLE_NAME, opts);
  }

  get tableName() {
    return TABLE_NAME;
  }

  add() {
    throw new Error('This method is not supported by this class');
  }

  update() {
    throw new Error('This method is not supported by this class');
  }

  delete() {
    throw new Error('This method is not supported by this class');
  }
};
