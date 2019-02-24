"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const sendgrid = __importStar(require("@sendgrid/mail"));
const validator = __importStar(require("email-validator"));
const injection_js_1 = require("injection-js");
const errors_1 = require("../../../JSCommon/errors");
let SendgridService = class SendgridService {
    createEmailRequest(email, htmlContent, subject, fromEmail) {
        if (!validator.validate(email)) {
            throw new Error('Invalid email');
        }
        // TODO: Change the hardcoded email to something read in from the constants file
        const emailAddress = fromEmail && validator.validate(fromEmail) ? fromEmail : 'team@hackpsu.org';
        return {
            from: emailAddress,
            html: htmlContent,
            replyTo: emailAddress,
            subject,
            to: email,
        };
    }
    /**
     * This function substitutes the provided
     * @param {String} html A string of HTML text that forms the body of the email.
     *        All substitutables must be formatted as $substitutable$.
     *        The HTML MUST contain the $NAME$ substitutable.
     * @param {String} name The name of the recipient
     * @param {Map<string, string>>} [substitutions] A map of strings with the following format
     *        { keyword-to-substitute: string-to-substitute-with, ... };
     *        Example: { date: "09-23-2000" }
     * @return {string} return substituted version of the html
     * @throws EmailReplacementError
     */
    emailSubstitute(html, name, substitutions) {
        let subbedHTML = name ? html.replace(/\$name\$/g, name) : html;
        if (substitutions) {
            for (const key in substitutions) {
                if (substitutions[key] && substitutions[key].length > 0 && key.length > 0) {
                    subbedHTML = subbedHTML.replace(new RegExp(`\\$${key}\\$`, 'g'), substitutions[key]);
                }
                else {
                    const error = new errors_1.EmailReplacementError('One or more substitution keyword or substitution-text is empty', key, substitutions[key]);
                    throw error;
                }
            }
        }
        return subbedHTML;
    }
    sendEmail(data) {
        return sendgrid.send(data);
    }
};
SendgridService = __decorate([
    injection_js_1.Injectable()
], SendgridService);
exports.SendgridService = SendgridService;
//# sourceMappingURL=sendgrid.service.js.map