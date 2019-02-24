"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BaseObject_1 = __importDefault(require("../BaseObject"));
class ExtraCreditAssignment extends BaseObject_1.default {
    get id() {
        return this.user_uid;
    }
    get schema() {
        return undefined;
    }
    constructor(data) {
        super();
        this.class_uid = data.cid;
        this.user_uid = data.uid;
    }
}
exports.ExtraCreditAssignment = ExtraCreditAssignment;
//# sourceMappingURL=extra-credit-assignment.js.map