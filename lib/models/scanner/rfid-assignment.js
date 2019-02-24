"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const json_asset_loader_1 = __importDefault(require("../../assets/schemas/json-asset-loader"));
const BaseObject_1 = __importDefault(require("../BaseObject"));
const rfidAssignmentSchema = json_asset_loader_1.default('rfidAssignmentSchema');
/**
 * @class RfidAssignment
 * @extends BaseObject
 * An assignment for an rfid band to a user
 */
class RfidAssignment extends BaseObject_1.default {
    get id() {
        return this.rfid_uid;
    }
    get schema() {
        return rfidAssignmentSchema;
    }
    constructor(data) {
        super();
        this.rfid_uid = data.rfid;
        this.user_uid = data.uid;
        this.time = data.time;
        this.hackathon = data.hackathon;
    }
}
exports.RfidAssignment = RfidAssignment;
//# sourceMappingURL=rfid-assignment.js.map