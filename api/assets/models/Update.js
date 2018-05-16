const BaseObject = require('./BaseObject');
const { liveUpdateSchema } = require('../helpers/schemas');
const Timeuuid = require('node-time-uuid');
const squel = require('squel');


const TABLE_NAME = 'LIVE_UPDATES';

module.exports = class Update extends BaseObject {
  constructor(data, uow) {
    super(uow, liveUpdateSchema, TABLE_NAME);
    this.uid = data.uid || new Timeuuid().toString('hex');
    this.update_title = data.update_title || null;
    this.update_text = data.update_text || null;
    this.update_image = data.update_image || null;
    this.update_time = data.update_time || null;
  }

  getAll(opts) {
    const query = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from(this.tableName)
      .fields((opts && opts.fields) || null)
      .order('uid')
      .offset((opts && opts.startAt) || null)
      .limit((opts && opts.count) || null)
      .toString()
      .concat(';');
    const params = [];
    return this.uow.query(query, params, { stream: true });
  }
};