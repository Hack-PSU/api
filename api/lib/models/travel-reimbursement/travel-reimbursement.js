"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const v4_1 = __importDefault(require("uuid/v4"));
const json_asset_loader_1 = __importDefault(require("../../assets/schemas/json-asset-loader"));
const BaseObject_1 = __importDefault(require("../BaseObject"));
const rfidAssignmentSchema = json_asset_loader_1.default('travelReimbursementSchema');
class TravelReimbursement extends BaseObject_1.default {
    get id() {
        return this.uid;
    }
    get schema() {
        return rfidAssignmentSchema;
    }
    static parseGroupMembers(groupMembers) {
        if (groupMembers === '4+') {
            return 4;
        }
        let parsed = parseInt(groupMembers, 10);
        if (parsed < 1) {
            throw new Error('Illegal number of group members');
        }
        if (parsed > 4) {
            parsed = 4;
        }
        return parsed;
    }
    constructor(data) {
        super();
        this.fullname = data.fullName;
        this.reimbursement_amount = data.reimbursementAmount || 0;
        this.mailing_address = data.mailingAddress;
        this.group_members = TravelReimbursement.parseGroupMembers(data.groupMembers);
        this.user_id = data.uid;
        this.receipt_uris = data.receiptURIs;
        this.uid = data.uid || v4_1.default().replace(/-/g, '');
    }
}
exports.TravelReimbursement = TravelReimbursement;
//# sourceMappingURL=travel-reimbursement.js.map