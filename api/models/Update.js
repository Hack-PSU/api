/* eslint-disable class-methods-use-this */
const Timeuuid = require('node-time-uuid');
const BaseObject = require('./BaseObject');
const liveUpdateSchema = require('../assets/database/schemas')('liveUpdateSchema');
const RtdbUow = require('../services/rtdb_uow');

const REFERENCE = '/updates';

module.exports = class Update extends BaseObject {
  constructor(data, uow) {
    super(uow);
    this.update_title = data.update_title || null;
    this.update_text = data.update_text || null;
    this.update_image = data.update_image || null;
    this.update_time = data.update_time || null;
    this.disallowedProperties = ['useRTDB'];
  }

  static get useRTDB() {
    return true;
  }

  get schema() {
    return liveUpdateSchema;
  }

  static getAll(uow) {
    return uow.query(RtdbUow.queries.GET, REFERENCE);
  }

  static getCount(uow) {
    return uow.query(RtdbUow.queries.COUNT, REFERENCE);
  }

  static generateTestData() {
    throw new Error('Not implemented');
  }

  add() {
    const validation = this.validate();
    if (!validation.result) {
      return Promise.reject(new Error(validation.error));
    }
    const uid = new Timeuuid().toString();
    return this.uow.query(RtdbUow.queries.SET, `${REFERENCE}/${uid}`, this._dbRepresentation);
  }
};
