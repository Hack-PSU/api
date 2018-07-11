/* eslint-disable class-methods-use-this,no-underscore-dangle */
const BaseObject = require('./BaseObject');
const Chance = require('chance');
const squel = require('squel');
const { Hackathon } = require('./Hackathon');

const registeredUserSchema = require('../assets/schemas/load-schemas')('registeredUserSchema');

const chance = new Chance();

const TABLE_NAME = 'REGISTRATION';
const COLUMN_NAME = 'uid';
module.exports.TABLE_NAME = TABLE_NAME;

module.exports.Registration = class Registration extends BaseObject {
  constructor(data, uow) {
    super(uow, registeredUserSchema);
    this.firstname = data.firstName || null;
    this.lastname = data.lastName || null;
    this.gender = data.gender || null;
    this.shirt_size = data.shirtSize || null;
    this.dietary_restriction = data.dietaryRestriction || null;
    this.allergies = data.allergies || '';
    this.travel_reimbursement = data.travelReimbursement || false;
    this.first_hackathon = data.firstHackathon || false;
    this.university = data.university || null;
    this.email = data.email || null;
    this.academic_year = data.academicYear || null;
    this.major = data.major || null;
    this.phone = data.phone || '0000000000';
    this.race = data.ethnicity || null;
    this.resume = data.resume || null;
    this.coding_experience = data.codingExperience || null;
    this.uid = data.uid || null;
    this.eighteenBeforeEvent = data.eighteenBeforeEvent || false;
    this.mlh_coc = data.mlhcoc || false;
    this.mlh_dcp = data.mlhdcp || false;
    this.referral = data.referral || null;
    this.project = data.projectDesc || null;
    this.expectations = data.expectations || null;
    this.veteran = data.veteran || 'no-disclose';
    this.time = new Date().getTime();
    this.hackathon = data.hackathon || null;
  }

  get schema() {
    return registeredUserSchema;
  }

  get tableName() {
    return TABLE_NAME;
  }

  add() {
    const validation = this.validate();
    if (!validation.result) {
      if (process.env.APP_ENV !== 'test') {
        console.warn('Validation failed while adding registration.');
        console.warn(this._dbRepresentation);
      }
      return Promise.reject(new Error(validation.error));
    }
    const query = squel.insert({
      autoQuoteFieldNames: true,
      autoQuoteTableNames: true,
    })
      .into(this.tableName)
      .setFieldsRows([this._dbRepresentation])
      .set('hackathon', Hackathon.getActiveHackathonQuery())
      .toParam();
    query.text = query.text.concat(';');
    return super.add({ query });
  }

  /**
   *
   * @param uid
   * @return {Promise<any>}
   */
  static getEmail(uid) {
    const query = squel.select({
      autoQuoteTableNames: true,
      autoQuoteFieldNames: true,
    })
      .from(TABLE_NAME)
      .field('email')
      .where('uid = ?', uid)
      .toString()
      .concat(';');
    return this.uow.query(query);
  }

  /**
   *
   * @param uow
   * @param opts
   * @return {Promise<Readable>}
   */
  static getAll(uow, opts) {
    if (opts && opts.currentHackathon) {
      const query = squel.select({
        autoQuoteTableNames: true,
        autoQuoteFieldNames: true,
      })
        .from(TABLE_NAME)
        .fields(opts.fields || null)
        .offset(opts.startAt || null)
        .limit(opts.count || null)
        .where('hackathon = ?', Hackathon.getActiveHackathonQuery())
        .toString()
        .concat(';');
      const params = [];
      return uow.query(query, params, { stream: true });
    }
    return super.getAll(uow, TABLE_NAME, opts);
  }

  /**
   *
   * @param uow
   * @param opts
   * @return {Promise<Stream>}
   */
  static getCount(uow, opts) {
    if (opts && opts.currentHackathon) {
      const query = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: false })
        .from(TABLE_NAME)
        .field(`COUNT(${COLUMN_NAME})`, 'count')
        .where('hackathon = ?', Hackathon.getActiveHackathonQuery())
        .toString()
        .concat(';');
      const params = [];
      return uow.query(query, params, { stream: true });
    }
    return super.getCount(uow, TABLE_NAME, COLUMN_NAME);
  }

  static generateTestData(uow) {
    const HACKATHON_ID = '84ed52ff52f84591aabe151666fae240';
    const testObj = new Registration({}, uow);
    testObj.firstname = chance.first();
    testObj.lastname = chance.last();
    testObj.gender = ['male', 'female', 'non-binary', 'no-disclose'][chance.integer({
      min: 0,
      max: 3,
    })];
    testObj.shirt_size = ['XS', 'S', 'M', 'L', 'XL', 'XXL'][chance.integer({
      min: 0,
      max: 5,
    })];
    testObj.dietary_restriction = ['vegetarian', 'vegan', 'halal', 'kosher', 'allergies', 'gluten-free'][chance.integer({
      min: 0,
      max: 5,
    })];
    testObj.allergies = chance.sentence();
    testObj.travel_reimbursement = chance.bool();
    testObj.first_hackathon = chance.bool();
    testObj.university = chance.name();
    testObj.email = chance.email();
    testObj.academic_year = ['freshman', 'sophomore', 'junior', 'senior', 'graduate', 'other'][chance.integer({
      min: 0,
      max: 5,
    })];
    testObj.major = chance.word();
    testObj.phone = chance.phone();
    testObj.race = chance.nationality();
    testObj.resume = chance.file({ extension: 'pdf' });
    testObj.coding_experience = ['none', 'beginner', 'intermediate', 'advanced', 'god', null][chance.integer({
      min: 0,
      max: 5,
    })];
    testObj.uid = chance.guid();
    testObj.eighteenBeforeEvent = true;
    testObj.mlh_coc = true;
    testObj.mlh_dcp = true;
    testObj.referral = chance.sentence();
    testObj.project = chance.paragraph();
    testObj.expectations = chance.paragraph();
    testObj.veteran = chance.bool()
      .toString();
    testObj.hackathon = HACKATHON_ID;
    return testObj;
  }

  /**
   * @param uow
   * @return {Promise<any>}
   */
  static getStatsCount(uow) {
    /* TODO (Shane): Does the map work, can this build with the squel.builder,
      and can you add the where clause that will ensure it
    only does this for the active hackathon? */
    const columnNames = {
      '"coding_experience"': 'coding_experience',
      '"dietary_restriction"': 'dietary_restriction',
      '"travel_reimbursement"': 'travel_reimbursement',
      '"race"': 'race',
      '"shirt_size"': 'shirt_size',
      '"gender"': 'gender',
      '"first_hackathon"': 'first_hackathon',
      '"veteran"': 'veteran',
    };

    // First Column - built as a string
    let query = squel.select({
      autoQuoteTableNames: true,
      autoQuoteFieldNames: false,
    })
      .from(TABLE_NAME)
      .field('"academic_year"', 'CATEGORY')
      .field('academic_year', 'OPTION')
      .field('COUNT(*)', 'COUNT')
      .group('academic_year')
      .toString();

    // Rest of the Columns in the list - built onto the existing string using UNION
    columnNames.forEach((value, key) => {
      query = query.concat(' UNION( ')
        .concat(squel.select({
          autoQuoteTableNames: true,
          autoQuoteFieldNames: false,
        })
          .from(TABLE_NAME)
          .field(key, 'CATEGORY')
          .field(value, 'OPTION')
          .field('COUNT(*)', 'COUNT')
          .group(value)
          .toString())
        .concat(')');
    });
    query = query.concat(';');
    return uow.query(query, null, { stream: true });
  }


  /**
   *
   * @return {Promise<any>}
   */
  submit() {
    const query = squel.update({
      autoQuoteTableNames: true,
      autoQuoteFieldNames: true,
    })
      .table(TABLE_NAME)
      .set('submitted', true)
      .where('uid = ?', this.uid)
      .toParam();
    query.text = query.text.concat(';');
    return this.uow.query(query.text, query.values);
  }
};
