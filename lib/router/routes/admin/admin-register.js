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
const email_validator_1 = require("email-validator");
const express_1 = require("express");
const injection_js_1 = require("injection-js");
const __1 = require("../..");
const errors_1 = require("../../../JSCommon/errors");
const util_1 = require("../../../JSCommon/util");
const register_1 = require("../../../models/register");
const rbac_types_1 = require("../../../services/auth/RBAC/rbac-types");
const logging_1 = require("../../../services/logging/logging");
const router_types_1 = require("../../router-types");
let AdminRegisterController = class AdminRegisterController extends router_types_1.ParentRouter {
    constructor(authService, registerDataMapper, activeHackathonDataMapper, registrationProcessor, acl, logger) {
        super();
        this.authService = authService;
        this.registerDataMapper = registerDataMapper;
        this.activeHackathonDataMapper = activeHackathonDataMapper;
        this.registrationProcessor = registrationProcessor;
        this.acl = acl;
        this.logger = logger;
        this.router = express_1.Router();
        this.routes(this.router);
    }
    routes(app) {
        app.get('/', this.authService.verifyAcl(this.acl, [rbac_types_1.AclOperations.READ_ALL, rbac_types_1.AclOperations.READ]), (req, res, next) => this.getAllRegistrationHandler(req, res, next));
        app.post('/update', this.authService.verifyAcl(this.acl, rbac_types_1.AclOperations.UPDATE), (req, res, next) => this.updateRegistrationHandler(req, res, next));
        app.get('/count', this.authService.verifyAcl(this.acl, rbac_types_1.AclOperations.COUNT), (req, res, next) => this.countRegistrationHandler(res, next));
    }
    validateRegistrationFields(registration) {
        if (!registration) {
            this.logger.error('No registration provided');
            throw new errors_1.HttpError('No registration provided', 400);
        }
        if (!email_validator_1.validate(registration.email)) {
            this.logger.error('Email used for registration is invalid');
            throw new errors_1.HttpError('Email used for registration is invalid', 400);
        }
        if (!registration.eighteenBeforeEvent) {
            this.logger.error('User must be over eighteen years of age to register');
            throw new errors_1.HttpError('User must be over eighteen years of age to register', 400);
        }
        if (!registration.mlhcoc) {
            this.logger.error('User must agree to MLH Code of Conduct');
            throw new errors_1.HttpError('User must agree to MLH Code of Conduct', 400);
        }
        if (!registration.mlhdcp) {
            this.logger.error('User must agree to MLH data collection policy');
            throw new errors_1.HttpError('User must agree to MLH data collection policy', 400);
        }
    }
    /**
     * @api {get} /admin/register Get registered hackers
     * @apiVersion 2.0.0
     * @apiName Get Registered Hackers
     * @apiGroup Admin Registration
     * @apiPermission TeamMemberPermission
     *
     * @apiParam {Number} limit=Math.inf Limit to a certain number of responses
     * @apiParam {Number} offset=0 The offset to start retrieving users from. Useful for pagination
     * @apiParam {string} hackathon The hackathon uid to get registration details for
     * @apiParam {boolean} allHackathons Whether to retrieve data for all hackathons
     * @apiParam {string} [uid] uid of the hacker
     * @apiParam {string} [email] email of the hacker
     * @apiUse AuthArgumentRequired
     *
     * @apiSuccess {Registration[]} Array of registered hackers
     * @apiUse ResponseBodyDescription
     */
    getAllRegistrationHandler(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            if (req.query.email || req.query.uid) {
                return this.getRegistrationHandler(req, res, next);
            }
            let result;
            try {
                result = yield this.registerDataMapper.getAll({
                    byHackathon: !res.locals.allHackathons,
                    count: res.locals.limit,
                    hackathon: res.locals.hackathon,
                    startAt: res.locals.offset,
                });
            }
            catch (error) {
                return util_1.Util.errorHandler500(error, next);
            }
            const response = new __1.ResponseBody('Success', 200, result);
            return this.sendResponse(res, response);
        });
    }
    /**
     * @api {get} /admin/register/count Get a count of Registered Users
     * @apiVersion 2.0.0
     * @apiName get count of registration
     * @apiGroup Admin Registration
     * @apiPermission TeamMemberPermission
     * @apiParam {string} hackathon The hackathon uid to get registration details for
     * @apiParam {boolean} allHackathons Whether to retrieve data for all hackathons
     * @apiUse AuthArgumentRequired
     *
     * @apiSuccess {number} number of registered users
     * @apiUse ResponseBodyDescription
     */
    countRegistrationHandler(res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            let result;
            try {
                result = yield this.registerDataMapper.getCount({
                    byHackathon: !res.locals.allHackathons,
                    hackathon: res.locals.hackathon,
                });
            }
            catch (error) {
                return util_1.Util.errorHandler500(error, next);
            }
            const response = new __1.ResponseBody('Success', 200, result);
            return this.sendResponse(res, response);
        });
    }
    /**
     * @api {post} /admin/register/update Update an existing registration
     * @apiVersion 2.0.0
     * @apiName Update Registration
     * @apiGroup Admin Registration
     * @apiPermission UserPermission
     * @apiParam {Registration} The updated registration object.
     * @apiUse AuthArgumentRequired
     * @apiUse ResponseBodyDescription
     */
    updateRegistrationHandler(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            // Validate incoming registration
            if (!req.body || !req.body.registration) {
                return util_1.Util.standardErrorHandler(new errors_1.HttpError('registration field missing', 400), next);
            }
            if (!req.body.registration.uid) {
                return util_1.Util.standardErrorHandler(new errors_1.HttpError('registration id missing', 400), next);
            }
            try {
                yield this.registrationProcessor.normaliseRegistrationData(req.body.registration);
            }
            catch (error) {
                return util_1.Util.standardErrorHandler(new errors_1.HttpError(error.toString(), 400), next);
            }
            let registration;
            try {
                registration = new register_1.Registration(req.body.registration);
            }
            catch (error) {
                return util_1.Util.standardErrorHandler(new errors_1.HttpError('Some properties were not as expected', 400), next);
            }
            try {
                const result = yield this.registerDataMapper.update(registration);
                const response = new __1.ResponseBody('Success', 200, result);
                return this.sendResponse(res, response);
            }
            catch (error) {
                return util_1.Util.errorHandler500(error, next);
            }
        });
    }
    getRegistrationHandler(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!req.query.email && !req.query.uid) {
                return util_1.Util.standardErrorHandler(new errors_1.HttpError('either email or uid must be provided', 400), next);
            }
            if (!req.query.hackathon) {
                const hackathon = yield this.activeHackathonDataMapper.activeHackathon.toPromise();
                req.query.hackathon = hackathon.id;
            }
            let uid;
            if (req.query.email) {
                ({ uid } = yield this.authService.getUserId(req.query.email));
            }
            else {
                uid = req.query.uid;
            }
            try {
                const result = yield this.registerDataMapper.get({ uid, hackathon: req.query.hackathon });
                const response = new __1.ResponseBody('Success', 200, result);
                return this.sendResponse(res, response);
            }
            catch (error) {
                return util_1.Util.errorHandler500(error, next);
            }
        });
    }
};
AdminRegisterController = __decorate([
    injection_js_1.Injectable(),
    __param(0, injection_js_1.Inject('IAuthService')),
    __param(1, injection_js_1.Inject('IRegisterDataMapper')),
    __param(2, injection_js_1.Inject('IActiveHackathonDataMapper')),
    __param(3, injection_js_1.Inject('IRegistrationProcessor')),
    __param(4, injection_js_1.Inject('IRegisterDataMapper')),
    __param(5, injection_js_1.Inject('BunyanLogger')),
    __metadata("design:paramtypes", [Object, Object, Object, Object, Object, logging_1.Logger])
], AdminRegisterController);
exports.AdminRegisterController = AdminRegisterController;
//# sourceMappingURL=admin-register.js.map