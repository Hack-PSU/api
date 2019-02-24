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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ajv_1 = __importDefault(require("ajv"));
const injection_js_1 = require("injection-js");
const lodash_1 = __importDefault(require("lodash"));
const json_asset_loader_1 = __importDefault(require("../assets/schemas/json-asset-loader"));
const errors_1 = require("../JSCommon/errors");
const email_history_1 = require("../models/admin/types/email-history");
const router_types_1 = require("../router/router-types");
const emailObjectSchema = json_asset_loader_1.default('emailObjectSchema');
let AdminProcessor = class AdminProcessor {
    constructor(adminDataMapper) {
        this.adminDataMapper = adminDataMapper;
    }
    validateAndSendEmails(emails, html, subject, fromEmail, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { goodEmails, badEmails } = this.validateEmails(emails);
            const badEmailsHistory = badEmails
                .map((email) => {
                return new email_history_1.EmailHistory(userId, email.email, html, subject, email.name, Date.now(), 'validation failed', email.error);
            });
            return this.sendEmails(goodEmails, badEmailsHistory, html, subject, fromEmail, userId);
        });
    }
    /**
     * @VisibleForTesting
     */
    validateEmails(emails) {
        // Run validation
        const validator = new ajv_1.default({ allErrors: true });
        const validateFunction = validator.compile(emailObjectSchema);
        const goodEmails = [];
        const badEmails = [];
        emails.map((emailObject) => {
            if (validateFunction(emailObject)) {
                const emailObjectWithMap = Object.assign({}, emailObject);
                emailObjectWithMap.substitutions = new Map(lodash_1.default.entries(emailObject.substitutions));
                goodEmails.push(emailObjectWithMap);
            }
            else {
                badEmails.push(Object.assign({}, emailObject, { error: validator.errorsText(validateFunction.errors) }));
            }
            return true;
        });
        if (goodEmails.length === 0) {
            throw new errors_1.HttpError('Emails could not be parsed properly', 400);
        }
        return { goodEmails, badEmails };
    }
    /**
     * @VisibleForTesting
     */
    sendEmails(goodEmails, badEmails, html, subject, fromEmail, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { successfulEmails, failedEmails } = yield this.adminDataMapper.sendEmails(goodEmails, html, subject, userId, fromEmail);
            const totalFailures = badEmails.concat(failedEmails);
            // If all failed, respond accordingly
            if (successfulEmails.length === 0) {
                throw new errors_1.HttpError({ failures: totalFailures, text: 'Could not send emails' }, 500);
            }
            yield this.adminDataMapper.addEmailHistory(successfulEmails, totalFailures);
            if (totalFailures.length !== 0) {
                return new router_types_1.ResponseBody('Some emails failed to send', 207, { result: 'partial success', data: { successfulEmails, totalFailures } });
            }
            return new router_types_1.ResponseBody('Successfully sent all emails', 200, { result: 'success', data: successfulEmails });
        });
    }
};
AdminProcessor = __decorate([
    injection_js_1.Injectable(),
    __param(0, injection_js_1.Inject('IAdminDataMapper')),
    __metadata("design:paramtypes", [Object])
], AdminProcessor);
exports.AdminProcessor = AdminProcessor;
//# sourceMappingURL=admin-processor.js.map