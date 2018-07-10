/* eslint-disable class-methods-use-this */
const BaseObject = require('./BaseObject');

const TABLE_NAME = 'ATTENDANCE';

module.exports.TABLE_NAME = TABLE_NAME;

module.exports.Attendance = class Attendance extends BaseObject {
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
  static getAll(uow) {
    return super.getAll(uow, TABLE_NAME);
  }

  static getCount(uow) {
    return super.getCount(uow, TABLE_NAME);
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
