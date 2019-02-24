"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = __importStar(require("crypto"));
const mailchimpApiV3 = require("mailchimp-api-v3");
const constants_1 = require("../../../assets/constants/constants");
class MailchimpService {
    constructor(mailchimpApiKey) {
        this.mailchimp = new mailchimpApiV3(mailchimpApiKey || constants_1.Constants.MailchimpApiKey);
    }
    addSubscriber(emailAddress, listId) {
        return this.mailchimp.post(`/lists/${listId}/members`, {
            email_address: emailAddress,
            status: 'subscribed',
        });
    }
    removeSubscriber(emaiId, listId) {
        return this.mailchimp.patch(`lists/${listId}/members/${crypto.createHash('md5')
            .update(emaiId)
            .digest('hex')}`, {
            status: 'unsubscribed',
        });
    }
    getSubscriber(emailId, listId) {
        return this.mailchimp.get(`lists/${listId}/members/${crypto.createHash('md5')
            .update(emailId)
            .digest('hex')}`);
    }
    findList(listName) {
        return this.mailchimp.get('lists')
            .then(({ lists }) => Promise.resolve(lists.filter(({ name }) => name === listName)));
    }
}
exports.MailchimpService = MailchimpService;
//# sourceMappingURL=mailchimp.service.js.map