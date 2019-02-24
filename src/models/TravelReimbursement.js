// const uuidv4 = require('uuid/v4');
// const squel = require('squel');
// const BaseObject = require('./BaseObject');
// const travelReimbursementSchema = require('../assets/schemas/json-asset-loader')('travelReimbursementSchema');
// const HttpError = require('../JSCommon/errors');
// const { Hackathon } = require('./Hackathon');
// const { logger } = require('../services/logging/logging');
//
// const TABLE_NAME = 'TRAVEL_REIMBURSEMENT';
// module.exports.TABLE_NAME = TABLE_NAME;
//
// module.exports.TravelReimbursement = class TravelReimbursement extends BaseObject {
//   constructor(data, uow) {
//     super(uow);
//     this.fullname = data.fullName || null;
//     this.reimbursement_amount = data.reimbursementAmount || 0;
//     this.mailing_address = data.mailingAddress || null;
//     this.group_members = data.groupMembers || null;
//     this.user_id = data.uid || null;
//     this.receipt_uris = data.receiptURIs || null;
//     this.uid = data.uuid || uuidv4().replace(/-/g, '');
//   }
//
//   static getAll(uow, opts) {
//     return super.getAll(uow, TABLE_NAME, opts);
//   }
//
//   static getCount(uow) {
//     return super.getCount(uow, TABLE_NAME);
//   }
//
//   static generateTestData() {
//     throw new Error('Not implemented');
//   }
//
//   add() {
//     const validation = this.validate();
//     if (!validation.result) {
//       if (process.env.APP_ENV !== 'test') {
//         logger.warn('Validation failed while adding travel reimbursement.');
//         logger.warn(this._dbRepresentation);
//       }
//       return Promise.reject(new HttpError(validation.error, 400));
//     }
//     const query = squel.insert({
//       autoQuoteFieldNames: true,
//       autoQuoteTableNames: true,
//     })
//       .into(this.tableName)
//       .setFieldsRows([this._dbRepresentation])
//       .set('hackathon', Hackathon.getActiveHackathonQuery())
//       .toParam();
//     query.text = query.text.concat(';');
//     return super.add({ query });
//   }
//
//   get schema() {
//     return travelReimbursementSchema;
//   }
//
//   get tableName() {
//     return TABLE_NAME;
//   }
// };
