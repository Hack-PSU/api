"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const injection_js_1 = require("injection-js");
const path = __importStar(require("path"));
const router_types_1 = require("../router/router-types");
// TODO: Refactor this to retrieve email template from cloud storage?
const EMAIL_TEMPLATE_PATH = '../assets/emails/email_template.html';
const REGISTRATION_EMAIL_BODY = '../assets/emails/registration_body.html';
const emailTemplate = fs.readFileSync(path.join(__dirname, EMAIL_TEMPLATE_PATH), 'utf-8');
const registrationEmailBody = fs.readFileSync(path.join(__dirname, REGISTRATION_EMAIL_BODY), 'utf-8');
const emailHtml = emailTemplate.replace('$$BODY$$', registrationEmailBody);
let RegistrationProcessor = class RegistrationProcessor {
    constructor(registerDataMapper, emailService) {
        this.registerDataMapper = registerDataMapper;
        this.emailService = emailService;
    }
    processRegistration(registration) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.registerDataMapper.insert(registration);
            const submission = yield this.registerDataMapper.submit(registration);
            yield this.sendRegistrationEmail(registration);
            return new router_types_1.ResponseBody('Success', 200, { result: 'Success', data: { registration, result, submission } });
        });
    }
    sendRegistrationEmail(registration) {
        return __awaiter(this, void 0, void 0, function* () {
            const html = emailHtml;
            const preparedHtml = yield this.emailService.emailSubstitute(html, registration.firstname);
            const emailData = this.emailService.createEmailRequest(registration.email, preparedHtml, 'Thank you for your Registration', '');
            return this.emailService.sendEmail(emailData);
        });
    }
    normaliseRegistrationData(registration) {
        /** Converting boolean strings to booleans types in registration */
        registration.travelReimbursement = registration.travelReimbursement === true || registration.travelReimbursement === 'true';
        registration.firstHackathon = registration.firstHackathon === true || registration.firstHackathon === 'true';
        registration.eighteenBeforeEvent = registration.eighteenBeforeEvent === true || registration.eighteenBeforeEvent === 'true';
        registration.mlhcoc = registration.mlhcoc === true || registration.mlhcoc === 'true';
        registration.mlhdcp = registration.mlhdcp === true || registration.mlhdcp === 'true';
    }
};
RegistrationProcessor = __decorate([
    injection_js_1.Injectable(),
    __param(0, injection_js_1.Inject('IRegisterDataMapper')),
    __param(1, injection_js_1.Inject('IEmailService')),
    __metadata("design:paramtypes", [Object, Object])
], RegistrationProcessor);
exports.RegistrationProcessor = RegistrationProcessor;
//# sourceMappingURL=registration-processor.js.map