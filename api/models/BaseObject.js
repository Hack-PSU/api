/* eslint-disable no-underscore-dangle,no-param-reassign,class-methods-use-this */
const squel = require('squel');
const Ajv = require('ajv');
const HttpError = require('../JSCommon/HttpError');

const ajv = new Ajv({ allErrors: true });


/**
 * @Abstract
 * @type {module.BaseObject}
 */
module.exports = class BaseObject {
  /**
   *
   * @param uow {MysqlUow}
   */
  constructor(uow) {
    if (Object.getPrototypeOf(this) === BaseObject.prototype) {
      throw new Error('BaseObject is abstract and cannot be instantiated');
    }
    this.uow = uow;
    // In a sub-class, make sure this array also includes all super properties
    this.disallowedProperties = ['uow', '_disallowedProperties'];
  }

  /**
   * Returns all or certain number of objects as a stream
   * @param uow
   * @param tableName
   * @param opts {{}} opts.fields: fields to include :: opts.startAt: object number to start at ::
   * opts.count: how many objects to return
   * @return {Promise<Stream>}
   */
  static getAll(uow, tableName, opts) {
    const query = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from(tableName)
      .fields((opts && opts.fields) || null)
      .offset((opts && opts.startAt) || null)
      .limit((opts && opts.count) || null)
      .toString()
      .concat(';');
    const params = [];
    return uow.query(query, params, { stream: true });
  }

  /**
   * Returns the number of objects of the type.
   * @param uow
   * @param tableName
   * @param columnName
   * @returns {Promise<Stream>}
   */
  static getCount(uow, tableName, columnName) {
    const query = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: false })
      .from(tableName)
      .field(`COUNT(${columnName || 'uid'})`, 'count')
      .toString()
      .concat(';');
    const params = [];
    return uow.query(query, params, { stream: true });
  }

  /**
   * Returns a representation of the object that can be added directly to the database
   * For any subclass that contains properties that do not get added to the db,
   * ensure that this method is overridden and calls super._dbRepresentation()
   * @return {Object}
   * @private
   */
  get _dbRepresentation() {
    return Object.entries(this)
      .filter(kv => !this.disallowedProperties.includes(kv[0]))
      .filter(kv => kv[1])
      .reduce((accumulator, currentValue) => {
        // eslint-disable-next-line prefer-destructuring
        accumulator[currentValue[0]] = currentValue[1];
        return accumulator;
      }, {});
  }

  get disallowedProperties() {
    return this._disallowedProperties;
  }

  set disallowedProperties(arr) {
    if (this._disallowedProperties) {
      this._disallowedProperties.push(arr);
    } else {
      this._disallowedProperties = arr;
    }
  }

  /**
   *
   * @returns {*} The primary key value for this object type
   */
  get id() {
    return this.uid;
  }

  get useRTDB() {
    return false;
  }

  /**
   *
   * @returns {string} Name of the column that is the Primary key in the DB
   */
  get columnName() {
    return 'uid';
  }

  get tableName() {
    throw new Error('Base Object does not have a tableName.');
  }

  get schema() {
    throw new Error('Base Object does not have a schema.');
  }
  /**
   * Validates that the object matches some ajv schema
   * @return {{result: boolean | ajv.Thenable<any>, error: *}}
   */
  validate() {
    if (this.schema) {
      const validate = ajv.compile(this.schema);
      const result = validate(this);
      return { result, error: result ? null : ajv.errorsText(validate.errors) };
    }
    return { result: true, error: null };
  }

  /**
   * Returns one object as noted by parameter uid
   * @param uid {String} uid of object
   * @param columnName {String} name of primary key column
   * @param opts {{}} opts.fields: fields to include
   * @return {Promise<Stream>}
   */
  get(opts) {
    if (opts && opts.query && opts.query.text && opts.query.values) {
      return this.uow.query(opts.query.text, opts.query.values);
    }
    const query = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(this.tableName)
      .fields((opts && opts.fields) || null)
      .where(`${this.columnName}= ?`, this.id)
      .toParam();
    query.text = query.text.concat(';');
    return this.uow.query(query.text, query.values);
  }

  /**
   * Adds a new object to the appropriate table
   * @return {Promise<any>}
   */
  add(opts) {
    if (opts && opts.query && opts.query.text && opts.query.values) {
      return this.uow.query(opts.query.text, opts.query.values);
    }
    const validation = this.validate();
    if (!validation.result) {
      if (process.env.APP_ENV !== 'test') {
        console.warn('Validation failed while adding object.');
        console.warn(this._dbRepresentation);
      }
      return Promise.reject(new HttpError(validation.error, 400));
    }
    const query = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(this.tableName)
      .setFieldsRows([this._dbRepresentation])
      .toParam();
    query.text = query.text.concat(';');
    return this.uow.query(query.text, query.values);
  }

  /**
   * Updates the object in the database
   * @return {Promise<any>}
   */
  update(opts) {
    if (opts && opts.query && opts.query.text && opts.query.values) {
      return this.uow.query(opts.query.text, opts.query.values);
    }
    const validation = this.validate();
    if (!validation.result) {
      return new Promise(((resolve, reject) => reject(new HttpError(validation.error, 400))));
    }
    const query = squel.update({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .table(this.tableName)
      .setFields(this._dbRepresentation)
      .where(`${this.columnName} = ?`, this.id)
      .toParam();
    query.text = query.text.concat(';');
    return this.uow.query(query.text, query.values);
  }

  /**
   * Deletes the object from the database
   * @return {Promise<any>}
   */
  delete(opts) {
    if (opts && opts.query && opts.query.text && opts.query.values) {
      return this.uow.query(opts.query.text, opts.query.values);
    }
    const query = squel.delete({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from(this.tableName)
      .where(`${this.columnName} = ?`, this.id)
      .toParam();
    query.text = query.text.concat(';');
    return this.uow.query(query.text, query.values);
  }
};
