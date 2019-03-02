// const BaseObject = require('./BaseObject');
// const { Hackathon } = require('./hackathon');
// const HttpError = require('../JSCommon/errors');
// const Chance = require('chance');
// const uuidv4 = require('uuid/v4');
// const squel = require('squel');
//
// const preRegisteredSchema = require('../assets/schemas/json-asset-loader')('preRegisteredSchema');
//
// const chance = new Chance();
//
// const TABLE_NAME = 'PRE_REGISTRATION';
// const COLUMN_NAME = 'uid';
// module.exports.TABLE_NAME = TABLE_NAME;
//
// module.exports.PreRegistration = class PreRegistration extends BaseObject {
//   constructor(data, uow) {
//     super(uow, preRegisteredSchema, TABLE_NAME);
//     this.uid = data.uid || uuidv4().replace(/-/g, '');
//     this.email = data.email || null;
//   }
//
//   static generateTestData(uow) {
//     const testObj = new PreRegistration({}, uow);
//     testObj.email = chance.email();
//     return testObj;
//   }
//
//   /**
//    *
//    * @param uow
//    * @param opts
//    * @return {Promise<Stream>}
//    */
//   static getAll(uow, opts) {
//     if (opts && opts.byHackathon) {
//       const query = squel.select({
//         autoQuoteTableNames: opts.quoteFields !== false,
//         autoQuoteFieldNames: opts.quoteFields !== false,
//       })
//         .from(TABLE_NAME)
//         .fields(opts.fields || null)
//         .offset(opts.startAt || null)
//         .limit(opts.count || null)
//         .where('hackathon = ?', Hackathon.getActiveHackathonQuery())
//         .toString()
//         .concat(';');
//       const params = [];
//       return uow.query(query, params, { stream: true });
//     }
//     return super.getAll(uow, TABLE_NAME, opts);
//   }
//
//   add() {
//     const validation = this.validate();
//     if (!validation.result) {
//       if (process.env.APP_ENV !== 'test') {
//         console.warn('Validation failed while adding registration.');
//         console.warn(this._dbRepresentation);
//       }
//       return Promise.reject(new HttpError(validation.error, 400 ));
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
//   /**
//    *
//    * @param uow
//    * @param opts
//    * @return {Promise<Stream>}
//    */
//   static getCount(uow, opts) {
//     return super.getCount(uow, TABLE_NAME, COLUMN_NAME);
//   }
//
//   get schema() {
//     return preRegisteredSchema;
//   }
//
//   get tableName() {
//     return TABLE_NAME;
//   }
// };
