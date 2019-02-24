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
Object.defineProperty(exports, "__esModule", { value: true });
var AdminController_1;
const email_validator_1 = require("email-validator");
const express_1 = require("express");
const injection_js_1 = require("injection-js");
const __1 = require("../..");
const errors_1 = require("../../../JSCommon/errors");
const util_1 = require("../../../JSCommon/util");
const extra_credit_assignment_1 = require("../../../models/extra-credit/extra-credit-assignment");
const rbac_types_1 = require("../../../services/auth/RBAC/rbac-types");
const router_types_1 = require("../../router-types");
let AdminController = AdminController_1 = class AdminController extends router_types_1.ParentRouter {
    constructor(authService, adminDataMapper, adminAcl, adminProcessor, extraCreditDataMapper, extraCreditAcl) {
        super();
        this.authService = authService;
        this.adminDataMapper = adminDataMapper;
        this.adminAcl = adminAcl;
        this.adminProcessor = adminProcessor;
        this.extraCreditDataMapper = extraCreditDataMapper;
        this.extraCreditAcl = extraCreditAcl;
        this.router = express_1.Router();
        this.routes(this.router);
    }
    static parseCommonRequestFields(request, response, next) {
        if (!request.query.limit || parseInt(request.query.limit, 10)) {
            response.locals.limit = parseInt(request.query.limit, 10);
        }
        else {
            const error = new errors_1.HttpError('Limit must be an integer', 400);
            return util_1.Util.standardErrorHandler(error, next);
        }
        if (!request.query.offset || parseInt(request.query.offset, 10)) {
            response.locals.offset = parseInt(request.query.offset, 10);
        }
        else {
            const error = new errors_1.HttpError('Offset must be an integer', 400);
            return util_1.Util.standardErrorHandler(error, next);
        }
        if (request.query.hackathon) {
            response.locals.hackathon = request.query.hackathon;
        }
        response.locals.allHackathons = !!request.query.allHackathons;
        return next();
    }
    routes(app) {
        if (!this.authService) {
            return;
        }
        // Use authentication
        app.use('/scanner', util_1.Util.getInstance('AdminScannerController').router);
        app.use('/checkout', util_1.Util.getInstance('AdminCheckoutController').router);
        app.use((req, res, next) => this.authService.authenticationMiddleware(req, res, next));
        app.use((req, res, next) => AdminController_1.parseCommonRequestFields(req, res, next));
        AdminController_1.registerRouter('register', 'AdminRegisterController', 2);
        AdminController_1.registerRouter('data', 'AdminStatisticsController', 2);
        AdminController_1.registerRouter('hackathon', 'AdminHackathonController', 2);
        // AdminController.registerRouter('location', 'AdminLocationController');
        app.get('/', (req, res) => this.mainHandler(res));
        app.get('/userid', this.authService.verifyAcl(this.adminAcl, rbac_types_1.AclOperations.GET_EMAIL), (req, res, next) => this.getUserIdHandler(req, res, next));
        app.post('/email', this.authService.verifyAcl(this.adminAcl, rbac_types_1.AclOperations.SEND_EMAIL), (req, res, next) => this.sendEmailHandler(req, res, next));
        app.post('/makeadmin', this.authService.verifyAcl(this.adminAcl, rbac_types_1.AclOperations.CREATE), (req, res, next) => this.makeAdminHandler(req, res, next));
        app.post('/extra_credit', this.authService.verifyAcl(this.extraCreditAcl, rbac_types_1.AclOperations.CREATE), (req, res, next) => this.addExtraCreditAssignmentHandler(req, res, next));
    }
    /**
     * @api {get} /admin/ Get Authentication Status
     * @apiVersion 2.0.0
     * @apiName Get Authentication Status
     * @apiGroup Admin
     * @apiPermission TeamMemberPermission
     *
     * @apiUse AuthArgumentRequired
     *
     * @apiSuccess {UserRecord} User details including privilege level
     * @apiUse ResponseBodyDescription
     */
    mainHandler(res) {
        const r = new __1.ResponseBody('Authorized admin', 200, { result: 'Success', data: res.locals.user });
        return this.sendResponse(res, r);
    }
    /**
     * @api {get} /admin/userid Get the uid corresponding to an email
     * @apiVersion 2.0.0
     * @apiName Get User Id
     * @apiGroup Admin
     * @apiPermission DirectorPermission
     *
     * @apiUse AuthArgumentRequired
     * @apiParam {string} email The email to query user id by
     * @apiSuccess {UserRecord} Object {uid, displayName, privilege, admin}
     * @apiUse IllegalArgumentError
     * @apiUse ResponseBodyDescription
     */
    getUserIdHandler(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!req.query ||
                !req.query.email ||
                !email_validator_1.validate(req.query.email)) {
                return util_1.Util.standardErrorHandler(new errors_1.HttpError('not a valid email to search', 400), next);
            }
            try {
                const result = yield this.adminDataMapper.getEmailFromId(req.query.email);
                const response = new __1.ResponseBody('Success', 200, result);
                return this.sendResponse(res, response);
            }
            catch (error) {
                return util_1.Util.errorHandler500(error, next);
            }
        });
    }
    /**
     * @api {post} /admin/email Send communication email to recipients
     * @apiVersion 2.0.0
     * @apiName Send communication emails
     *
     * @apiGroup Admin
     * @apiPermission DirectorPermission
     *
     * @apiUse AuthArgumentRequired
     * @apiParam {Object[]} emails An array of objects with the following schema { email: <email>, name: <name of person>, substitutions: {...} }
     *                   Substitutions is a map { keyword: substitute-text }
     * @apiParam {String} subject The subject of the email to send
     * @apiParam {String} html The HTML/text email to send. Make sure that all words that need to be substituted have matching substitutes in each object in the emails array
     *
     * @apiParamExample {Object} Request-Example:
     *                  {
     *                    emails: [{
     *                        email: abc@email.com,
     *                        name: Name,
     *                        substitutions: {
     *                          date: '29-03-2014',
     *                          language: 'english',
     *                          ...,
     *                          }
     *                        },
     *                        {...},
     *                        ...],
     *                    fromEmail: "IEmail address send from and reply to. *NOTE: email are case sensitive"
     *                    subject: "generic email",
     *                    html: "<html><head><body>.....</body></head></html>"
     *                  }
     * @apiSuccess (200) {Object[]} Responses All responses from the emails sent
     * @apiSuccess (207) {Object[]} Partial-Success An array of success responses as well as failure objects
     * @apiUse ResponseBodyDescription
     */
    /**
     * TODO: Future project: change this to be an orchestrated communication system that will
     *  take as parameters the channels to send the communication to and support multiple
     *  orchestrated communication channels.
     */
    sendEmailHandler(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            // Validate incoming request
            if (!req.body) {
                return util_1.Util.standardErrorHandler(new errors_1.HttpError('Illegal request format', 400), next);
            }
            if (!req.body.emails) {
                return util_1.Util.standardErrorHandler(new errors_1.HttpError('Could not find email data to send', 400), next);
            }
            if (!req.body.html || typeof req.body.html !== 'string') {
                return util_1.Util.standardErrorHandler(new errors_1.HttpError('Could not find email content to send', 400), next);
            }
            if (!req.body.subject) {
                return util_1.Util.standardErrorHandler(new errors_1.HttpError('Could not find email subject to send', 400), next);
            }
            // Send the emails
            try {
                const response = yield this.adminProcessor.validateAndSendEmails(req.body.emails, req.body.html, req.body.subject, req.body.fromEmail, res.locals.user.uid);
                return this.sendResponse(res, response);
            }
            catch (error) {
                return util_1.Util.errorHandler500(error, next);
            }
        });
    }
    /**
     * @api {post} /admin/makeadmin Change a user's privileges
     * @apiVersion 2.0.0
     * @apiName Elevate user
     *
     * @apiGroup Admin
     * @apiPermission DirectorPermission
     *
     * @apiUse AuthArgumentRequired
     * @apiParam {String} uid The UID or email of the user to change admin privileges
     * @apiParam {Number} privilege The privilege level to set to {1: Volunteer, 2: Team Member, 3: Exec, 4: Tech-Exec, 5: Finance Director}
     * @apiUse IllegalArgumentError
     * @apiUse ResponseBodyDescription
     */
    makeAdminHandler(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!req.body || !req.body.uid) {
                return util_1.Util.standardErrorHandler(new errors_1.HttpError('Uid of new admin required', 400), next);
            }
            if (!req.body || !req.body.privilege) {
                return util_1.Util.standardErrorHandler(new errors_1.HttpError('New privilege level required', 400), next);
            }
            try {
                const result = yield this.adminDataMapper.modifyPermissions(req.body.uid, parseInt(req.body.privilege, 10), res.locals.privilege);
                return this.sendResponse(res, new __1.ResponseBody('Successfully changed the status', 200, result));
            }
            catch (error) {
                return util_1.Util.standardErrorHandler(error, next);
            }
        });
    }
    /**
     * @api {post} /admin/extra_credit Track an extra credit class for a student
     * @apiName Assign Extra Credit
     * @apiVersion 2.0.0
     * @apiGroup Admin
     * @apiPermission DirectorPermission
     *
     * @apiParam {String} uid - the id associated with the student
     * @apiParam {String} cid - the id associated with the class
     * @apiUse AuthArgumentRequired
     * @apiSuccess {ExtraCreditAssignment} The inserted extra credit assignment
     * @apiUse IllegalArgumentError
     * @apiUse ResponseBodyDescription
     */
    addExtraCreditAssignmentHandler(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            // Validate incoming request
            if (!req.body) {
                return util_1.Util.standardErrorHandler(new errors_1.HttpError('Illegal request format', 400), next);
            }
            if (!req.body.uid) {
                return util_1.Util.standardErrorHandler(new errors_1.HttpError('Could not find hacker uid', 400), next);
            }
            if (!req.body.cid || !parseInt(req.body.cid, 10)) {
                return util_1.Util.standardErrorHandler(new errors_1.HttpError('Could not find valid class id', 400), next);
            }
            try {
                const ecAssignment = new extra_credit_assignment_1.ExtraCreditAssignment(req.body);
                const result = yield this.extraCreditDataMapper.insert(ecAssignment);
                const response = new __1.ResponseBody('Success', 200, result);
                return this.sendResponse(res, response);
            }
            catch (error) {
                return util_1.Util.errorHandler500(error, next);
            }
        });
    }
};
AdminController.baseRoute = 'admin/';
AdminController = AdminController_1 = __decorate([
    injection_js_1.Injectable(),
    __param(0, injection_js_1.Inject('IAuthService')),
    __param(1, injection_js_1.Inject('IAdminDataMapper')),
    __param(2, injection_js_1.Inject('IAdminDataMapper')),
    __param(3, injection_js_1.Inject('IAdminProcessor')),
    __param(4, injection_js_1.Inject('IExtraCreditDataMapper')),
    __param(5, injection_js_1.Inject('IExtraCreditDataMapper')),
    __metadata("design:paramtypes", [Object, Object, Object, Object, Object, Object])
], AdminController);
exports.AdminController = AdminController;
//# sourceMappingURL=admin.js.map