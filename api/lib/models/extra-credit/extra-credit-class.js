"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BaseObject_1 = __importDefault(require("../BaseObject"));
class ExtraCreditClass extends BaseObject_1.default {
    get id() {
        return this.uid;
    }
    get schema() {
        return undefined;
    }
    constructor(data) {
        super();
        this.class_name = data.class_name;
    }
    validate() {
        const result = typeof this.class_name === 'string';
        if (!result) {
            return { result, error: 'Class name must be of type string' };
        }
        return { result: true };
    }
}
exports.ExtraCreditClass = ExtraCreditClass;
//# sourceMappingURL=extra-credit-class.js.map