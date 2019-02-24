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
const express_1 = require("express");
const injection_js_1 = require("injection-js");
const __1 = require("../..");
const errors_1 = require("../../../JSCommon/errors");
const util_1 = require("../../../JSCommon/util");
const rbac_types_1 = require("../../../services/auth/RBAC/rbac-types");
const logging_1 = require("../../../services/logging/logging");
const router_types_1 = require("../../router-types");
let AdminStatisticsController = class AdminStatisticsController extends router_types_1.ParentRouter {
    constructor(authService, adminStatisticsDataMapper, extraCreditDataMapper, rsvpDataMapper, acl, attendanceDataMapper, registerDataMapper, preRegDataMapper, logger) {
        super();
        this.authService = authService;
        this.adminStatisticsDataMapper = adminStatisticsDataMapper;
        this.extraCreditDataMapper = extraCreditDataMapper;
        this.rsvpDataMapper = rsvpDataMapper;
        this.acl = acl;
        this.attendanceDataMapper = attendanceDataMapper;
        this.registerDataMapper = registerDataMapper;
        this.preRegDataMapper = preRegDataMapper;
        this.logger = logger;
        this.router = express_1.Router();
        this.routes(this.router);
    }
    routes(app) {
        app.use(this.authService.verifyAcl(this.acl, rbac_types_1.AclOperations.READ));
        app.get('/', (req, res, next) => this.getStatistics(req, res, next));
    }
    /**
     * @api {get} /admin/data/?type=registration_stats Get all user data
     * @apiVersion 2.0.0
     * @apiName Get list of all users
     * @apiGroup Admin Statistics
     * @apiPermission TeamMemberPermission
     *
     * @apiParam {Number} limit=Math.inf Limit to a certain number of responses
     * @apiParam {Number} offset=0 The offset to start retrieving users from. Useful for pagination
     *
     * @apiUse AuthArgumentRequired
     *
     * @apiSuccess {UserStatistics[]} Array of all users
     * @apiUse ResponseBodyDescription
     * @apiUse RequestOpts
     */
    getRegistrationStatisticsHandler(res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            let result;
            try {
                result = yield this.adminStatisticsDataMapper.getAllUserData({
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
     * @api {get} /admin/data/?type=registration_category_count Get the count of category data
     * @apiVersion 2.0.0
     * @apiName Get Registration Statistics Count
     * @apiGroup Admin Statistics
     * @apiPermission TeamMemberPermission
     *
     * @apiUse AuthArgumentRequired
     *
     * @apiSuccess {number[]} number of users that selected particular categories for registrations
     * @apiUse ResponseBodyDescription
     * @apiUse RequestOpts
     */
    getRegistrationStatisticsCountHandler(res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            let result;
            try {
                result = yield this.registerDataMapper.getRegistrationStats({
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
     * @api {get} /admin/data/?type=stats_count Get number of users by interaction type (Pre registration, Registration, RSVP, Event scans)
     * @apiVersion 2.0.0
     * @apiName Get User Count
     * @apiGroup Admin Statistics
     * @apiPermission TeamMemberPermission
     *
     * @apiUse AuthArgumentRequired
     *
     * @apiSuccess {number[]} number of all users in each category (PreRegistration, Registration, RSVP, Scans)
     * @apiUse ResponseBodyDescription
     * @apiUse RequestOpts
     */
    getUserCountByCategoryHandler(res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            let result;
            try {
                result = yield this.adminStatisticsDataMapper.getUserCountByCategory({
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
     * @api {get} /admin/data/?type=preregistration_count Get a count of Preregistered Users
     * @apiVersion 2.0.0
     * @apiName get count preregistration
     * @apiGroup Admin Statistics
     * @apiPermission TeamMemberPermission
     *
     * @apiUse AuthArgumentRequired
     *
     * @apiSuccess {number} number of preregistered users
     * @apiUse ResponseBodyDescription
     * @apiUse RequestOpts
     */
    getPreRegistrationCountHandler(res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            let result;
            try {
                result = yield this.preRegDataMapper.getCount({
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
     * @api {get} /admin/data/?type=preregistration Get all pre-registered users
     * @apiVersion 2.0.0
     * @apiName Get Pre-registration
     * @apiGroup Admin Statistics
     * @apiPermission TeamMemberPermission
     *
     * @apiUse AuthArgumentRequired
     *
     * @apiSuccess {PreRegistration[]} all preregistered users
     * @apiUse ResponseBodyDescription
     * @apiUse RequestOpts
     */
    getPreRegistrationHandler(res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.preRegDataMapper.getAll({
                    byHackathon: !res.locals.allHackathons,
                    count: res.locals.limit,
                    hackathon: res.locals.hackathon,
                    startAt: res.locals.offset,
                });
                const response = new __1.ResponseBody('Success', 200, result);
                return this.sendResponse(res, response);
            }
            catch (error) {
                return util_1.Util.errorHandler500(error, next);
            }
        });
    }
    /**
     * @api {get} /admin/data/?type=rsvp Get all RSVP'ed users
     * @apiVersion 2.0.0
     * @apiName Get RSVP
     * @apiGroup Admin Statistics
     * @apiPermission TeamMemberPermission
     *
     * @apiUse AuthArgumentRequired
     *
     * @apiSuccess {Rsvp[]} Array of Rsvp
     * @apiUse ResponseBodyDescription
     * @apiUse RequestOpts
     */
    getRsvpHandler(res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.rsvpDataMapper.getAll({
                    byHackathon: !res.locals.allHackathons,
                    count: res.locals.limit,
                    hackathon: res.locals.hackathon,
                    startAt: res.locals.offset,
                });
                const response = new __1.ResponseBody('Success', 200, result);
                return this.sendResponse(res, response);
            }
            catch (error) {
                return util_1.Util.errorHandler500(error, next);
            }
        });
    }
    /**
     * @api {get} /admin/data/?type=rsvp_count Get number of RSVP'ed users
     * @apiVersion 2.0.0
     * @apiName Get RSVP Count
     * @apiGroup Admin Statistics
     * @apiPermission TeamMemberPermission
     *
     * @apiUse AuthArgumentRequired
     *
     * @apiSuccess {number} number of rsvp
     * @apiUse ResponseBodyDescription
     * @apiUse RequestOpts
     */
    getRsvpCountHandler(res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.rsvpDataMapper.getCount({
                    byHackathon: !res.locals.allHackathons,
                    count: res.locals.limit,
                    hackathon: res.locals.hackathon,
                    startAt: res.locals.offset,
                });
                const response = new __1.ResponseBody('Success', 200, result);
                return this.sendResponse(res, response);
            }
            catch (error) {
                return util_1.Util.errorHandler500(error, next);
            }
        });
    }
    /**
     * @api {get} /admin/data/?type=attendance Get all attendance data
     * @apiVersion 2.0.0
     * @apiName Get Attendance
     * @apiGroup Admin Statistics
     * @apiPermission TeamMemberPermission
     *
     * @apiUse AuthArgumentRequired
     *
     * @apiSuccess {Attendance[]} All Attendance data
     * @apiUse ResponseBodyDescription
     * @apiUse RequestOpts
     */
    getAttendanceHandler(res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.attendanceDataMapper.getAll({
                    byHackathon: !res.locals.allHackathons,
                    count: res.locals.limit,
                    hackathon: res.locals.hackathon,
                    startAt: res.locals.offset,
                });
                const response = new __1.ResponseBody('Success', 200, result);
                return this.sendResponse(res, response);
            }
            catch (error) {
                return util_1.Util.errorHandler500(error, next);
            }
        });
    }
    /**
     * @api {get} /admin/data/?type=attendance&aggregator=event Get all attendance data by event
     * @apiVersion 2.0.0
     * @apiName Get Attendance by event
     * @apiGroup Admin Statistics
     * @apiPermission TeamMemberPermission
     * @apiParam [uid] {String} The uid of an event to filter by
     * @apiUse AuthArgumentRequired
     *
     * @apiSuccess {EventUid-Registration[]} All Attendance data aggregated by event
     * @apiUse ResponseBodyDescription
     * @apiUse RequestOpts
     * @apiUse RequestOpts
     */
    getAttendanceByEventHandler(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.attendanceDataMapper.getAttendanceByEvent({
                    byHackathon: !res.locals.allHackathons,
                    count: res.locals.limit,
                    hackathon: res.locals.hackathon,
                    startAt: res.locals.offset,
                    uid: req.query.uid,
                });
                const response = new __1.ResponseBody('Success', 200, result);
                return this.sendResponse(res, response);
            }
            catch (error) {
                return util_1.Util.errorHandler500(error, next);
            }
        });
    }
    /**
     * @api {get} /admin/data/?type=attendance&aggregator=user Get all attendance data by user
     * @apiVersion 2.0.0
     * @apiName Get Attendance by user
     * @apiGroup Admin Statistics
     * @apiPermission TeamMemberPermission
     * @apiParam [uid] {String} The uid of a user to filter by
     * @apiUse AuthArgumentRequired
     *
     * @apiSuccess {UserUid-Event[]} All Attendance data aggregated by event
     * @apiUse ResponseBodyDescription
     * @apiUse RequestOpts
     */
    getAttendanceByUserHandler(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.attendanceDataMapper.getAttendanceByUser({
                    byHackathon: !res.locals.allHackathons,
                    count: res.locals.limit,
                    hackathon: res.locals.hackathon,
                    startAt: res.locals.offset,
                    uid: req.query.uid,
                });
                const response = new __1.ResponseBody('Success', 200, result);
                return this.sendResponse(res, response);
            }
            catch (error) {
                return util_1.Util.errorHandler500(error, next);
            }
        });
    }
    /**
     * @api {get} /admin/data/?type=extra_credit_classes Get all extra credit classes
     * @apiVersion 2.0.0
     * @apiName Get Extra Credit Classes
     * @apiGroup Admin Statistics
     * @apiPermission TeamMemberPermission
     *
     * @apiUse AuthArgumentRequired
     *
     * @apiSuccess {ExtraCreditClasses} Array of extra credit classes
     * @apiUse ResponseBodyDescription
     * @apiUse RequestOpts
     */
    getExtraCreditClassesHandler(res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.extraCreditDataMapper.getAllClasses({
                    byHackathon: !res.locals.allHackathons,
                    count: res.locals.limit,
                    hackathon: res.locals.hackathon,
                    startAt: res.locals.offset,
                });
                const response = new __1.ResponseBody('Success', 200, result);
                return this.sendResponse(res, response);
            }
            catch (error) {
                return util_1.Util.errorHandler500(error, next);
            }
        });
    }
    /**
     * Handler that parses query type and routes to the appropriate handler
     */
    getStatistics(req, res, next) {
        if (!req.query.type) {
            return util_1.Util.standardErrorHandler(new errors_1.HttpError('Type of required statistic must be provided in query', 400), next);
        }
        switch (req.query.type) {
            case 'stats_count':
                return this.getUserCountByCategoryHandler(res, next);
            case 'preregistration_count':
                return this.getPreRegistrationCountHandler(res, next);
            case 'preregistration':
                return this.getPreRegistrationHandler(res, next);
            case 'registration_category_count':
                return this.getRegistrationStatisticsCountHandler(res, next);
            case 'registration_stats':
                return this.getRegistrationStatisticsHandler(res, next);
            case 'rsvp':
                return this.getRsvpHandler(res, next);
            case 'rsvp_count':
                return this.getRsvpCountHandler(res, next);
            case 'attendance':
                switch (req.query.aggregator) {
                    case 'event':
                        return this.getAttendanceByEventHandler(req, res, next);
                    case 'user':
                        return this.getAttendanceByUserHandler(req, res, next);
                    default:
                        return this.getAttendanceHandler(res, next);
                }
            case 'extra_credit_classes':
                return this.getExtraCreditClassesHandler(res, next);
            default:
                return util_1.Util.standardErrorHandler(new errors_1.HttpError('provided statistics type is not supported', 400), next);
        }
    }
};
AdminStatisticsController = __decorate([
    injection_js_1.Injectable(),
    __param(0, injection_js_1.Inject('IAuthService')),
    __param(1, injection_js_1.Inject('IAdminStatisticsDataMapper')),
    __param(2, injection_js_1.Inject('IExtraCreditDataMapper')),
    __param(3, injection_js_1.Inject('IRsvpDataMapper')),
    __param(4, injection_js_1.Inject('IAdminStatisticsDataMapper')),
    __param(5, injection_js_1.Inject('IAttendanceDataMapper')),
    __param(6, injection_js_1.Inject('IRegisterDataMapper')),
    __param(7, injection_js_1.Inject('IPreRegisterDataMapper')),
    __param(8, injection_js_1.Inject('BunyanLogger')),
    __metadata("design:paramtypes", [Object, Object, Object, Object, Object, Object, Object, Object, logging_1.Logger])
], AdminStatisticsController);
exports.AdminStatisticsController = AdminStatisticsController;
//# sourceMappingURL=admin-statistics.js.map