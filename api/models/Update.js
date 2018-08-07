/* eslint-disable class-methods-use-this */
const Timeuuid = require('node-time-uuid');
const BaseObject = require('./BaseObject');
const { UowFactory } = require('../services/factories/uow_factory');
const liveUpdateSchema = require('../assets/schemas/load-schemas')('liveUpdateSchema');
const RtdbUow = require('../services/rtdb_uow');

const HackathonPromise = UowFactory.create()
  .then((uow) => {
    return uow.query(...Hackathon.getActiveHackathonQuery().toParam());
  });
let REFERENCE = '';
HackathonPromise.then((result) => {
  REFERENCE = `/updates/${result[0]}`;
});

module.exports.Update = class Update extends BaseObject {
  constructor(data, uow) {
    super(uow);
    this.update_title = data.updateTitle || null;
    this.update_text = data.updateText || null;
    this.update_image = data.updateImage || null;
    this.update_time = data.updateTime || new Date().getTime();
    this.push_notification = data.pushNotification || false;
    this.disallowedProperties = ['useRTDB', 'push_notification'];
  }

  static get useRTDB() {
    return true;
  }

  get schema() {
    return liveUpdateSchema;
  }

  static getAll(uow) {
    return HackathonPromise.then(() => uow.query(RtdbUow.queries.GET, REFERENCE));
  }

  static getCount(uow) {
    return HackathonPromise.then(() => uow.query(RtdbUow.queries.COUNT, REFERENCE));
  }

  static generateTestData() {
    throw new Error('Not implemented');
  }

  static getReference(uow) {
    return HackathonPromise.then(() => uow.query(RtdbUow.queries.REF, `${REFERENCE}`));
  }

  add() {
    const validation = this.validate();
    if (!validation.result) {
      return Promise.reject(new Error(validation.error));
    }
    const uid = new Timeuuid().toString();
    return HackathonPromise.then(() => this.uow.query(RtdbUow.queries.SET, `${REFERENCE}/${uid}`, this._dbRepresentation));
  }

  get() {
    return HackathonPromise.then(() => this.uow.query(RtdbUow.queries.GET, `${REFERENCE}/${this.uid}`));
  }

  update() {
    return HackathonPromise.then(() =>
      this.uow.query(RtdbUow.queries.UPDATE, `${REFERENCE}/${this.uid}`, this._dbRepresentation));
  }

  delete() {
    return HackathonPromise.then(() => this.uow.query(RtdbUow.queries.DELETE, `${REFERENCE}/${this.uid}`));
  }
};
