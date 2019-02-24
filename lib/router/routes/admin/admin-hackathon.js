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
const hackathon_1 = require("../../../models/hackathon");
const rbac_types_1 = require("../../../services/auth/RBAC/rbac-types");
const logging_1 = require("../../../services/logging/logging");
const router_types_1 = require("../../router-types");
let AdminHackathonController = class AdminHackathonController extends router_types_1.ParentRouter {
    constructor(authService, adminHackathonDataMapper, acl, adminAcl, logger) {
        super();
        this.authService = authService;
        this.adminHackathonDataMapper = adminHackathonDataMapper;
        this.acl = acl;
        this.adminAcl = adminAcl;
        this.logger = logger;
        this.router = express_1.Router();
        this.routes(this.router);
    }
    routes(app) {
        app.get('/', this.authService.verifyAcl(this.acl, rbac_types_1.AclOperations.READ_ALL), (req, res, next) => this.getAllHackathonHandler(res, next));
        app.get('/count', this.authService.verifyAcl(this.acl, rbac_types_1.AclOperations.COUNT), (req, res, next) => this.countHackathonHandler(res, next));
        app.post('/', this.authService.verifyAcl(this.acl, rbac_types_1.AclOperations.CREATE), (req, res, next) => this.createHackathonHandler(req, res, next));
        app.post('/active', this.authService.verifyAcl(this.adminAcl, rbac_types_1.AclOperations.MAKE_ACTIVE), (req, res, next) => this.makeHackathonActiveHandler(req, res, next));
        app.post('/update', this.authService.verifyAcl(this.acl, rbac_types_1.AclOperations.UPDATE), (req, res, next) => this.updateHackathonHandler(req, res, next));
    }
    /**
     * @api {post} /admin/hackathon Add a new non-active hackathon
     * @apiVersion 2.0.0
     * @apiName Add new hackathon
     * @apiGroup Admin Hackathon
     * @apiPermission DirectorPermission
     * @apiParam {string} name The name of the new hackathon
     * @apiParam {number} startTime Epoch time for when the hackathon starts
     * @apiParam {number} endTime Epoch time for when the hackathon ends
     *
     * @apiUse AuthArgumentRequired
     * @apiUse ResponseBodyDescription
     *
     * @apiSuccess (200) {Hackathon} The inserted hackathon
     */
    createHackathonHandler(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            // Validate incoming request
            if (!req.body) {
                return util_1.Util.standardErrorHandler(new errors_1.HttpError('Illegal request format', 400), next);
            }
            if (!req.body.name) {
                return util_1.Util.standardErrorHandler(new errors_1.HttpError('Could not find name of new hackathon', 400), next);
            }
            if (!req.body.startTime) {
                return util_1.Util.standardErrorHandler(new errors_1.HttpError('Could not find start time of hackathon', 400), next);
            }
            req.body.startTime = parseInt(req.body.startTime, 10);
            if (req.body.basePin) {
                req.body.basePin = parseInt(req.body.basePin, 10);
            }
            let hackathon;
            try {
                hackathon = new hackathon_1.Hackathon(req.body);
            }
            catch (error) {
                return util_1.Util.standardErrorHandler(error, next);
            }
            try {
                const result = yield this.adminHackathonDataMapper.insert(hackathon);
                const response = new __1.ResponseBody('Success', 200, result);
                return this.sendResponse(res, response);
            }
            catch (error) {
                return util_1.Util.errorHandler500(error, next);
            }
        });
    }
    /**
     * @api {post} /admin/hackathon/active Mark a hackathon as active
     * @apiVersion 2.0.0
     * @apiDescription Ends the currently active hackathon and marks the provided hackathon as active
     * @apiName Add Active hackathon
     * @apiGroup Admin Hackathon
     * @apiPermission DirectorPermission
     * @apiParam {string} uid ID of the hackathon entry to mark active
     * @apiUse AuthArgumentRequired
     *
     * @apiSuccess (200) {Hackathon} Newly "activated" hackathon
     * @apiUse ResponseBodyDescription
     */
    makeHackathonActiveHandler(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            // Validate incoming request
            if (!req.body) {
                return util_1.Util.standardErrorHandler(new errors_1.HttpError('Illegal request format', 400), next);
            }
            if (!req.body.uid) {
                return util_1.Util.standardErrorHandler(new errors_1.HttpError('Could not find ID of hackathon', 400), next);
            }
            try {
                const result = yield this.adminHackathonDataMapper.makeActive(req.body.uid);
                const response = new __1.ResponseBody('Success', 200, result);
                return this.sendResponse(res, response);
            }
            catch (error) {
                return util_1.Util.errorHandler500(error, next);
            }
        });
    }
    /**
     * @api {post} /admin/hackathon/update Update non-active hackathon
     * @apiVersion 2.0.0
     * @apiName Update hackathon
     * @apiGroup Hackathon
     * @apiPermission DirectorPermission
     * @apiParam {string} name The name of the new hackathon
     * @apiParam {number} startTime Epoch time for when the hackathon starts
     * @apiParam {number} endTime Epoch time for when the hackathon ends
     *
     * @apiUse AuthArgumentRequired
     *
     * @apiSuccess (200) {Hackathon} The updated hackathon
     * @apiUse ResponseBodyDescription
     */
    updateHackathonHandler(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            // Validate incoming request
            if (!req.body) {
                return util_1.Util.standardErrorHandler(new errors_1.HttpError('Illegal request format', 400), next);
            }
            if (!req.body.uid) {
                return util_1.Util.standardErrorHandler(new errors_1.HttpError('Could not find ID of hackathon', 400), next);
            }
            let hackathon;
            try {
                hackathon = new hackathon_1.Hackathon(req.body);
            }
            catch (error) {
                return util_1.Util.standardErrorHandler(error, next);
            }
            try {
                const result = yield this.adminHackathonDataMapper.update(hackathon);
                const response = new __1.ResponseBody('Success', 200, result);
                return this.sendResponse(res, response);
            }
            catch (error) {
                return util_1.Util.standardErrorHandler(error, next);
            }
        });
    }
    /**
     * @api {get} /admin/hackathon Get all hackathons
     * @apiVersion 2.0.0
     * @apiName Get Hackathons
     * @apiGroup Admin Hackathon
     * @apiPermission TeamMemberPermission
     *
     * @apiParam {Number} limit=Math.inf Limit to a certain number of responses
     * @apiParam {Number} offset=0 The offset to start retrieving users from. Useful for pagination
     *
     * @apiUse AuthArgumentRequired
     *
     * @apiSuccess {Hackathon[]} Array of hackathons
     * @apiUse ResponseBodyDescription
     */
    getAllHackathonHandler(res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.adminHackathonDataMapper.getAll({
                    count: res.locals.limit,
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
     * @api {get} /admin/hackathon/count Get a count of hackathons
     * @apiVersion 2.0.0
     * @apiName get count of hackathon
     * @apiGroup Admin Hackathon
     * @apiPermission TeamMemberPermission
     * @apiUse AuthArgumentRequired
     *
     * @apiSuccess {number} the number of hackathons
     * @apiUse ResponseBodyDescription
     */
    countHackathonHandler(res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.adminHackathonDataMapper.getCount();
                const response = new __1.ResponseBody('Success', 200, result);
                return this.sendResponse(res, response);
            }
            catch (error) {
                return util_1.Util.errorHandler500(error, next);
            }
        });
    }
};
AdminHackathonController = __decorate([
    injection_js_1.Injectable(),
    __param(0, injection_js_1.Inject('IAuthService')),
    __param(1, injection_js_1.Inject('IActiveHackathonDataMapper')),
    __param(2, injection_js_1.Inject('IActiveHackathonDataMapper')),
    __param(3, injection_js_1.Inject('IAdminDataMapper')),
    __param(4, injection_js_1.Inject('BunyanLogger')),
    __metadata("design:paramtypes", [Object, Object, Object, Object, logging_1.Logger])
], AdminHackathonController);
exports.AdminHackathonController = AdminHackathonController;
//# sourceMappingURL=admin-hackathon.js.map