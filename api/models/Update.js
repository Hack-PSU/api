/* eslint-disable class-methods-use-this */
const Timeuuid = require('node-time-uuid');
const BaseObject = require('./BaseObject');
const {UowFactory} = require('../services/factories/uow_factory');
const liveUpdateSchema = require('../assets/schemas/load-schemas')('liveUpdateSchema');
const {Hackathon} = require('../models/Hackathon');
const RtdbUow = require('../services/rtdb_uow');

let REFERENCE = '';


module.exports.Update = class Update extends BaseObject {
  constructor(data, uow, sqluow) {
    super(uow);
    const query = Hackathon.getActiveHackathonQuery().toParam();
    this.hackathonPromise = sqluow.query(query.text, query.values);
    this.hackathonPromise.then((result) => {
      REFERENCE = `/updates/${result[0].uid}`;
    });
    this.update_title = data.updateTitle || null;
    this.update_text = data.updateText || null;
    this.update_image = data.updateImage || null;
    this.update_time = data.updateTime || new Date().getTime();
    this.push_notification = data.pushNotification || false;
    this.disallowedProperties = ['useRTDB', 'push_notification', 'hackathonPromise'];
  }

  static get useRTDB() {
    return true;
  }

  get schema() {
    return liveUpdateSchema;
  }

  static getAll(uow, sqluow) {
    const query = Hackathon.getActiveHackathonQuery().toParam();
    const hackathonPromise = sqluow.query(query.text, query.values);
    return hackathonPromise.then((result) => {
      console.log(result);
      REFERENCE = `/updates/${result[0].uid}`;
      return uow.query(RtdbUow.queries.GET, REFERENCE);
    });
  }

  static getCount(uow, sqluow) {
    const query = Hackathon.getActiveHackathonQuery().toParam();
    const hackathonPromise = sqluow.query(query.text, query.values);
    return hackathonPromise.then((result) => {
      REFERENCE = `/updates/${result[0].uid}`;
      return uow.query(RtdbUow.queries.COUNT, REFERENCE);
    });
  }

  static generateTestData() {
    throw new Error('Not implemented');
  }

  static getReference(uow, sqluow) {
    const query = Hackathon.getActiveHackathonQuery().toParam();
    const hackathonPromise = sqluow.query(query.text, query.values);
    return hackathonPromise.then((result) => {
      REFERENCE = `/updates/${result[0].uid}`;
      return uow.query(RtdbUow.queries.REF, REFERENCE);
    });
  }

  add() {
    const validation = this.validate();
    if (!validation.result) {
      return Promise.reject(new Error(validation.error));
    }
    const uid = new Timeuuid().toString();
    return this.hackathonPromise.then(() => this.uow.query(RtdbUow.queries.SET, `${REFERENCE}/${uid}`, this._dbRepresentation));
  }

  get() {
    return this.hackathonPromise.then(() => this.uow.query(RtdbUow.queries.GET, `${REFERENCE}/${this.uid}`));
  }

  update() {
    return this.hackathonPromise.then(() =>
      this.uow.query(RtdbUow.queries.UPDATE, `${REFERENCE}/${this.uid}`, this._dbRepresentation));
  }

  delete() {
    return this.hackathonPromise.then(() => this.uow.query(RtdbUow.queries.DELETE, `${REFERENCE}/${this.uid}`));
  }
};
