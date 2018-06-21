const uuid = require('uuid/v4');
const BaseObject = require('./BaseObject');
const { travelReimbursementSchema } = require('../helpers/schemas');

const TABLE_NAME = 'TRAVEL_REIMBURSEMENT';
module.exports = TABLE_NAME;

module.exports = class TravelReimbursement extends BaseObject {
  constructor(data, uow) {
    super(uow, travelReimbursementSchema, TABLE_NAME);
    this.fullname = data.fullName || null;
    this.reimbursement_amount = data.reimbursementAmount || 0;
    this.mailing_address = data.mailingAddress || null;
    this.group_members = data.groupMembers || null;
    this.user_id = data.uid || null;
    this.receipt_uris = data.receiptURIs || null;
    this.uid = data.uid || uuid().replace(/-/g, '');
  }

  static getAll(uow, opts) {
    return super.getAll(uow, TABLE_NAME, opts);
  }

  static generateTestData() {
    throw new Error('Not implemented');
  }
};
