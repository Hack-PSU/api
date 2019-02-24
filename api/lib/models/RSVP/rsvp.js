"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const json_asset_loader_1 = __importDefault(require("../../assets/schemas/json-asset-loader"));
const BaseObject_1 = __importDefault(require("../BaseObject"));
const rsvpSchema = json_asset_loader_1.default('rsvpSchema');
exports.TABLE_NAME = 'RSVP';
class Rsvp extends BaseObject_1.default {
    get id() {
        return this.uid;
    }
    get schema() {
        return rsvpSchema;
    }
    constructor(data) {
        super();
        this.uid = data.uid;
        this.rsvp_time = data.rsvp_time;
        this.rsvp_status = data.rsvp_status || false;
    }
}
exports.Rsvp = Rsvp;
//# sourceMappingURL=rsvp.js.map