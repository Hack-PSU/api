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
const injection_js_1 = require("injection-js");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const squel_1 = __importDefault(require("squel"));
const errors_1 = require("../../JSCommon/errors");
const auth_types_1 = require("../../services/auth/auth-types");
const generic_data_mapper_1 = require("../../services/database/svc/generic-data-mapper");
const mysql_uow_service_1 = require("../../services/database/svc/mysql-uow.service");
const email_history_1 = require("./types/email-history");
let AdminDataMapperImpl = class AdminDataMapperImpl extends generic_data_mapper_1.GenericDataMapper {
    constructor(acl, authService, sql, emailService) {
        super(acl);
        this.acl = acl;
        this.authService = authService;
        this.sql = sql;
        this.emailService = emailService;
        this.GET_EMAIL = 'admin:get_email';
        this.SEND_EMAIL = 'admin:send_email';
        this.CREATE = 'admin:create';
        this.REDUCE_PERMISSION = 'admin:reduce_perm';
        this.MAKE_ACTIVE = 'admin:make_active';
        super.addRBAC([this.GET_EMAIL, this.SEND_EMAIL, this.CREATE, this.MAKE_ACTIVE], [auth_types_1.AuthLevel.DIRECTOR], undefined, [auth_types_1.AuthLevel[auth_types_1.AuthLevel.TEAM_MEMBER]]);
        super.addRBAC(this.REDUCE_PERMISSION, [auth_types_1.AuthLevel.TECHNOLOGY], undefined, [auth_types_1.AuthLevel[auth_types_1.AuthLevel.DIRECTOR]]);
    }
    getEmailFromId(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return rxjs_1.from(this.authService.getUserId(id))
                .pipe(operators_1.map((uid) => ({ result: 'Success', data: uid }))).toPromise();
        });
    }
    sendEmails(emails, html, subject, senderUid, fromEmail) {
        return __awaiter(this, void 0, void 0, function* () {
            // Substitute the HTML with the substituted data
            const failedEmails = [];
            const successfulEmails = [];
            yield Promise.all(emails.map((email) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const substitutedHtml = yield this.emailService.emailSubstitute(html, email.name, email.substitutions);
                    yield this.emailService.sendEmail(this.emailService.createEmailRequest(email.email, substitutedHtml, subject, fromEmail));
                    successfulEmails.push(new email_history_1.EmailHistory(senderUid, email.email, substitutedHtml, subject, email.name, Date.now(), '200'));
                }
                catch (error) {
                    failedEmails.push(new email_history_1.EmailHistory(senderUid, email.email, html, subject, email.name, Date.now(), '207', error));
                }
            })));
            return { successfulEmails, failedEmails };
        });
    }
    addEmailHistory(successfulEmails, failedEmails) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = squel_1.default.insert({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
                .into('EMAIL_HISTORY')
                .setFieldsRows([
                ...(successfulEmails.map(email => email.dbRepresentation)),
                ...(failedEmails.map(email => email.dbRepresentation)),
            ])
                .toParam();
            query.text = query.text.concat(';');
            return rxjs_1.from(this.sql.query(query.text, query.values, { cache: false })).pipe(operators_1.map(() => ({ result: 'Success', data: undefined }))).toPromise();
        });
    }
    /**
     *
     * @param {UidType | string} identifier Identifier to look up UserRecord with
     * @param {AuthLevel} permissionLevel Requested permission level
     * @param {AuthLevel} userPrivilege Permission level of the current user
     * @returns {Promise<IDbResult<void>>}
     */
    modifyPermissions(identifier, permissionLevel, userPrivilege) {
        return __awaiter(this, void 0, void 0, function* () {
            // Verify that if the permission is reduced, the user has the authority to do so
            let userRecord;
            try {
                userRecord = yield this.authService.getUserId(identifier);
            }
            catch (error) {
                throw new errors_1.HttpError('Could not retrieve user record. Did you provide a valid identifier?', 400);
            }
            if (permissionLevel < userRecord.customClaims.privilege &&
                !this.authService.aclVerifier(userPrivilege, this.REDUCE_PERMISSION)) {
                throw new errors_1.HttpError('You do not have permission to reduce someone else\'s permission', 400);
            }
            // Set the custom claim in Firebase
            return rxjs_1.from(this.authService.elevate(userRecord.uid, permissionLevel)).pipe(operators_1.map(() => ({ result: 'Success', data: undefined }))).toPromise();
        });
    }
};
AdminDataMapperImpl = __decorate([
    injection_js_1.Injectable(),
    __param(0, injection_js_1.Inject('IAcl')),
    __param(1, injection_js_1.Inject('IAuthService')),
    __param(2, injection_js_1.Inject('MysqlUow')),
    __param(3, injection_js_1.Inject('IEmailService')),
    __metadata("design:paramtypes", [Object, Object, mysql_uow_service_1.MysqlUow, Object])
], AdminDataMapperImpl);
exports.AdminDataMapperImpl = AdminDataMapperImpl;
//# sourceMappingURL=admin-data-mapper-impl.js.map