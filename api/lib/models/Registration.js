/* eslint-disable class-methods-use-this,no-underscore-dangle */
import * as Chance                                     from 'chance';
import * as squel                                      from 'squel';
import { Readable }                                    from 'stream';
import assets                                          from '../assets/schemas/json-asset-loader';
import { HttpError }                                   from '../JSCommon/errors';
import { IUow }                                        from '../services/database/svc/uow.service';
import { Logger }                                      from '../services/logging/logging';
import BaseObject                                      from './BaseObject';
import { Hackathon, TABLE_NAME as HackathonTableName } from './Hackathon';

const registeredUserSchema = assets('registeredUserSchema');

const chance = new Chance();

export const TABLE_NAME = 'REGISTRATION';
const COLUMN_NAME = 'uid';

/**
 * TODO: Add documentation
 */
export class Registration extends BaseObject {

  get schema() {
    return registeredUserSchema;
  }

  get tableName() {
    return TABLE_NAME;
  }

  get id() {
    return this.uid;
  }

  // /**
  //  *
  //  * @param uid
  //  * @return {Promise<any>}
  //  */
  // public static getEmail(uow: IUow, uid: string) {
  //   const query = squel.select({
  //     autoQuoteFieldNames: true,
  //     autoQuoteTableNames: true,
  //   })
  //     .from(TABLE_NAME)
  //     .field('email')
  //     .where('uid = ?', uid)
  //     .toString()
  //     .concat(';');
  //   return uow.query(query, [], { stream: false, cache: true });
  // }

  // /**
  //  *
  //  * @param uow
  //  * @param opts
  //  * @return {Promise<Readable>}
  //  */
  // public static getAll(uow, opts): Promise<Readable> {
  //   if (opts && opts.byHackathon) {
  //     const query = squel.select({
  //       autoQuoteFieldNames: opts.quoteFields !== false,
  //       autoQuoteTableNames: opts.quoteFields !== false,
  //     })
  //       .from(TABLE_NAME, 'reg')
  //       .fields(opts.fields || null)
  //       .offset(opts.startAt || null)
  //       .limit(opts.count || null)
  //       .join(
  //         HackathonTableName,
  //         'hackathon',
  //         'hackathon.active = 1 and reg.hackathon = hackathon.uid',
  //       )
  //       .toString()
  //       .concat(';');
  //     const params = [];
  //     return uow.query(query, params, { stream: true });
  //   }
  //   return super.getAll(uow, TABLE_NAME, opts);
  // }

  /**
   *
   * TODO: This method should be migrated to RFID Assignments model
   */
  public static getAllRfidAssignments(uow, opts) {
    if (opts && opts.byHackathon) {
      const query = squel.select({
        autoQuoteFieldNames: opts.quoteFields !== false,
        autoQuoteTableNames: opts.quoteFields !== false,
      })
        .from(TABLE_NAME, 'reg')
        .fields(opts.fields || null)
        .offset(opts.startAt || null)
        .limit(opts.count || null)
        .join(
          HackathonTableName,
          'hackathon',
          'hackathon.active = 1 and reg.hackathon = hackathon.uid',
        )
        .left_join(
          'RFID_ASSIGNMENTS',
          'rfid',
          'rfid.user_uid = reg.uid and rfid.hackathon = reg.hackathon',
        )
        .toString()
        .concat(';');
      const params = [];
      return uow.query(query, params, { stream: true });
    }
    return super.getAll(uow, TABLE_NAME, opts);
  }

  // /**
  //  *
  //  * @param uow
  //  * @param opts
  //  * @return {Promise<Stream>}
  //  */
  // public static getCount(uow, opts) {
  //   if (opts && opts.byHackathon) {
  //     const query = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: false })
  //       .from(TABLE_NAME)
  //       .field(`COUNT(${COLUMN_NAME})`, 'count')
  //       .where('hackathon = ?', Hackathon.getActiveHackathonQuery())
  //       .toString()
  //       .concat(';');
  //     const params = [];
  //     return uow.query(query, params, { stream: true });
  //   }
  //   return super.getCount(uow, TABLE_NAME, COLUMN_NAME);
  // }

  // public static generateTestData(uow) {
  //   const HACKATHON_ID = '84ed52ff52f84591aabe151666fae240';
  //   const testObj = new Registration({}, uow);
  //   testObj.firstname = chance.first();
  //   testObj.lastname = chance.last();
  //   testObj.gender = ['male', 'female', 'non-binary', 'no-disclose'][chance.integer({
  //     max: 3,
  //     min: 0,
  //   })];
  //   testObj.shirt_size = ['XS', 'S', 'M', 'L', 'XL', 'XXL'][chance.integer({
  //     max: 5,
  //     min: 0,
  //   })];
  //   testObj.dietary_restriction =
  //     ['vegetarian', 'vegan', 'halal', 'kosher', 'allergies', 'gluten-free'][chance.integer(
  //       {
  //         max: 5,
  //         min: 0,
  //       })];
  //   testObj.allergies = chance.sentence();
  //   testObj.travel_reimbursement = chance.bool();
  //   testObj.first_hackathon = chance.bool();
  //   testObj.university = chance.name();
  //   testObj.email = chance.email();
  //   testObj.academic_year =
  //     ['freshman', 'sophomore', 'junior', 'senior', 'graduate', 'other'][chance.integer(
  //       {
  //         max: 5,
  //         min: 0,
  //       })];
  //   testObj.major = chance.word();
  //   testObj.phone = chance.phone();
  //   testObj.race = chance.nationality();
  //   testObj.resume = chance.file({ extension: 'pdf' });
  //   testObj.coding_experience =
  //     ['none', 'beginner', 'intermediate', 'advanced', 'god', null][chance.integer(
  //       {
  //         max: 5,
  //         min: 0,
  //       })];
  //   testObj.uid = chance.guid();
  //   testObj.eighteenBeforeEvent = true;
  //   testObj.mlh_coc = true;
  //   testObj.mlh_dcp = true;
  //   testObj.referral = chance.sentence();
  //   testObj.project = chance.paragraph();
  //   testObj.expectations = chance.paragraph();
  //   testObj.veteran = chance.bool()
  //     .toString();
  //   testObj.hackathon = HACKATHON_ID;
  //   return testObj;
  // }

  // /**
  //  * @param uow
  //  * @return {Promise<any>}
  //  */
  // public static getStatsCount(uow) {
  //   const columnNames = [
  //     'academic_year',
  //     'coding_experience',
  //     'dietary_restriction',
  //     'travel_reimbursement',
  //     'race',
  //     'shirt_size',
  //     'gender',
  //     'first_hackathon',
  //     'veteran',
  //   ];
  //   let query = null;
  //   columnNames.forEach((value, index) => {
  //     // Add a union for every value but the first
  //     query = index === 0 ? Registration._getSelectQueryForOptionName(value) : query.union(
  //       Registration._getSelectQueryForOptionName(value));
  //   });
  //   query = query.toString().concat(';');
  //   return uow.query(query, null, { stream: true });
  // }
  //
  // public static _getSelectQueryForOptionName(value) {
  //   return squel.select({
  //     autoQuoteFieldNames: false,
  //     autoQuoteTableNames: true,
  //   })
  //     .from(TABLE_NAME)
  //     .field(`"${value}"`, 'CATEGORY')
  //     .field(value, 'OPTION')
  //     .field('COUNT(*)', 'COUNT')
  //     .join(
  //       HackathonTableName,
  //       'hackathon',
  //       `hackathon.uid = ${TABLE_NAME}.hackathon and hackathon.active = 1`,
  //     )
  //     .group(value);
  // }

  protected firstname: string;
  protected lastname: string;
  protected gender: string;
  // TODO: Change to enum
  protected shirt_size: string;
  // TODO: Change to enum
  protected dietary_restriction: string;
  // TODO: Change to enum
  protected allergies: string;
  protected travel_reimbursement: boolean;
  protected first_hackathon: boolean;
  protected university: string;
  protected email: string;
  protected academic_year: string;
  protected major: string;
  protected phone: string;
  protected race: string;
  protected resume: string;
  protected coding_experience: string;
  protected uid: string;
  protected eighteenBeforeEvent: boolean;
  protected mlh_coc: boolean;
  protected mlh_dcp: boolean;
  protected referral: string;
  protected project: string;
  protected expectations: string;
  protected veteran: string;
  protected time: number;
  protected hackathon: string;

  constructor(data: any, uow: IUow) {
    super(uow);
    this.firstname = data.firstName || null;
    this.lastname = data.lastName || null;
    this.gender = data.gender || null;
    this.shirt_size = data.shirtSize || null;
    this.dietary_restriction = data.dietaryRestriction || null;
    this.allergies = data.allergies || null;
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

  // public get() {
  //   const query = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
  //     .from(this.tableName)
  //     .where(`${this.columnName}= ?`, this.id)
  //     .order('time', false)
  //     .toParam();
  //   query.text = query.text.concat(';');
  //   return super.get({ query });
  // }

  // public getCurrent() {
  //   const query = squel.select({ autoQuoteFieldNames: false, autoQuoteTableNames: true })
  //     .from(this.tableName, 'registration')
  //     .field('registration.*')
  //     .field('registration.pin - hackathon.base_pin', 'pin')
  //     .where(`registration.${this.columnName}= ?`, this.id)
  //     .join(HackathonTableName, 'hackathon', 'hackathon = hackathon.uid and hackathon.active = 1')
  //     .toParam();
  //   query.text = query.text.concat(';');
  //   return super.get({ query });
  // }

  // public add() {
  //   const validation = this.validate();
  //   if (!validation.result) {
  //     logger.info('Validation failed while adding registration.');
  //     logger.info(this.dbRepresentation);
  //     return Promise.reject(new HttpError(validation.error, 400));
  //   }
  //   const query = squel.insert({
  //     autoQuoteFieldNames: true,
  //     autoQuoteTableNames: true,
  //   })
  //     .into(this.tableName)
  //     .setFieldsRows([this.dbRepresentation])
  //     .set('hackathon', Hackathon.getActiveHackathonQuery())
  //     .toParam();
  //   query.text = query.text.concat(';');
  //   return super.add({ query });
  // }

  // public update() {
  //   const validation = this.validate();
  //   if (!validation.result) {
  //     return new Promise(((resolve, reject) => reject(new Error(validation.error))));
  //   }
  //   const query = squel.update({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
  //     .table(this.tableName)
  //     .setFields(this.dbRepresentation)
  //     .where(`${this.columnName} = ?`, this.id)
  //     .where('hackathon = ?', Hackathon.getActiveHackathonQuery())
  //     .toParam();
  //   query.text = query.text.concat(';');
  //   return super.update({ query });
  // }

  // public delete() {
  //   const query = squel.delete({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
  //     .from(this.tableName)
  //     .where(`${this.columnName} = ?`, this.id)
  //     .where('hackathon = ?', Hackathon.getActiveHackathonQuery())
  //     .toParam();
  //   query.text = query.text.concat(';');
  //   return super.delete({ query });
  // }

  // /**
  //  *
  //  * @return {Promise<any>}
  //  */
  // public submit() {
  //   const query = squel.update({
  //     autoQuoteFieldNames: true,
  //     autoQuoteTableNames: true,
  //   })
  //     .table(TABLE_NAME)
  //     .set('submitted', true)
  //     .where('uid = ?', this.uid)
  //     .where('hackathon = ?', Hackathon.getActiveHackathonQuery())
  //     .toParam();
  //   query.text = query.text.concat(';');
  //   return this.uow.query(query.text, query.values, { stream: false, cache: false });
  // }
}
