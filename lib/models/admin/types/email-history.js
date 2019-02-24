"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BaseObject_1 = __importDefault(require("../../BaseObject"));
class EmailHistory extends BaseObject_1.default {
    constructor(sender, recipient, email_content, subject, recipient_name, time, status, error) {
        super();
        this.sender = sender;
        this.recipient = recipient;
        this.email_content = email_content;
        this.subject = subject;
        this.recipient_name = recipient_name;
        this.time = time;
        this.status = status;
        this.error = error;
        this.disallowedProperties = ['error'];
    }
    get id() {
        return null;
    }
    get schema() {
        return null;
    }
}
exports.EmailHistory = EmailHistory;
//# sourceMappingURL=email-history.js.map