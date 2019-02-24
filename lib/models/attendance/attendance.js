"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BaseObject_1 = __importDefault(require("../BaseObject"));
exports.TABLE_NAME = 'ATTENDANCE';
/**
 * TODO: Add documentation
 */
class Attendance extends BaseObject_1.default {
    get schema() {
        return null;
    }
    get id() {
        return this.idSCANS;
    }
    constructor(data) {
        super();
    }
}
exports.Attendance = Attendance;
//# sourceMappingURL=attendance.js.map