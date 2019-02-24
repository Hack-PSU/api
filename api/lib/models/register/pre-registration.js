"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const v4_1 = __importDefault(require("uuid/v4"));
const json_asset_loader_1 = __importDefault(require("../../assets/schemas/json-asset-loader"));
const BaseObject_1 = __importDefault(require("../BaseObject"));
const preRegisteredSchema = json_asset_loader_1.default('preRegisteredSchema');
class PreRegistration extends BaseObject_1.default {
    get id() {
        return this.uid;
    }
    get schema() {
        return preRegisteredSchema;
    }
    constructor(email, uid) {
        super();
        this.email = email;
        this.uid = uid || v4_1.default().replace(/-/g, '');
    }
}
exports.PreRegistration = PreRegistration;
//# sourceMappingURL=pre-registration.js.map