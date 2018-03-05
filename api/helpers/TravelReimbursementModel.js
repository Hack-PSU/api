const uuid = require("uuid/v4");
module.exports = class TravelReimbursementModel {
    constructor(data) {
        this.fullname = data.fullName;
        this.reimbursement_amount = data.reimbursementAmount;
        this.mailing_address = data.mailingAddress;
        this.group_members = data.groupMembers;
        this.receipt_uris = data.receiptURIs;
        this.uid = new uuid();
    }
};