/* eslint-disable no-underscore-dangle,no-param-reassign */

const squel = require('squel');

const Ajv = require('ajv');

const ajv = new Ajv({ allErrors: true });

module.exports = class BaseObject {
  constructor(uow, schema, tableName) {
    this.uow = uow;
    this.schema = schema;
    this.tableName = tableName;
  }

  /**
   *
   * @return {{}}
   * @private
   */
  _dbRepresentation() {
    return Object.entries(this)
      .filter(kv => !'uowschematableName'.includes(kv[0]))
      .reduce((accumulator, currentValue) => {
        accumulator[currentValue[0]] = currentValue[1];
        return accumulator;
      }, {});
  }


  validate() {
    const validate = ajv.compile(this.schema);
    const result = validate(this);
    return { result, error: result ? null : ajv.errorsText(validate.errors) };
  }

  /**
   *
   * @return {Promise<Stream>}
   */
  getAll(opts) {
    const query = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from(this.tableName)
      .fields((opts && opts.fields) || null)
      .offset(opts.startAt)
      .limit(opts.count)
      .toString()
      .concat(';');
    const params = [];
    return this.uow.query(query, params, { stream: true });
  }

  /**
   *
   * @param uid
   * @param opts
   * @return {Promise<Stream>}
   */
  get(uid, opts) {
    const query = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(this.tableName)
      .fields((opts && opts.fields) || null)
      .where('uid = ?', uid)
      .toParam();
    query.text = query.text.concat(';');
    return this.uow.query(query.text, query.values, { stream: true });
  }

  add() {
    const validation = this.validate();
    if (!validation.result) {
      return new Promise(((resolve, reject) => reject(new Error(validation.error))));
    }
    const query = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(this.tableName)
      .setFieldsRows([this._dbRepresentation()])
      .toParam();
    query.text = query.text.concat(';');
    return this.uow.query(query.text, query.values);
  }


  update() {
    const validation = this.validate();
    if (!validation.result) {
      return new Promise(((resolve, reject) => reject(new Error(validation.error))));
    }
    const query = squel.update({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .table(this.tableName)
      .setFields(this._dbRepresentation())
      .toParam();
    query.text = query.text.concat(';');
    return this.uow.query(query.text, query.values);
  }

  delete(uid) {
    const query = squel.delete({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from(this.tableName)
      .where('uid = ?', uid)
      .toParam();
    query.text = query.text.concat(';');
    return this.uow.query(query.text, query.values);
  }
}
