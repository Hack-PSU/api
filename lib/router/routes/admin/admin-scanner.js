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
const scanner_controller_abstract_1 = require("./scanner-controller-abstract");
let AdminScannerController = class AdminScannerController extends scanner_controller_abstract_1.ScannerController {
    constructor(adminStatisticsDataMapper, scannerProcessor, activeHackathonDataMapper, authService, scannerAuthService, scannerAcl, scannerDataMapper, registerDataMapper) {
        super(authService, scannerAuthService, scannerAcl, scannerDataMapper, registerDataMapper, activeHackathonDataMapper);
        this.adminStatisticsDataMapper = adminStatisticsDataMapper;
        this.scannerProcessor = scannerProcessor;
        this.router = express_1.Router();
        this.routes(this.router);
    }
    routes(app) {
        app.post('/assign', (req, res, next) => this.verifyScannerPermissionsMiddleware(req, res, next, rbac_types_1.AclOperations.CREATE), (req, res, next) => this.addRfidAssignments(req, res, next));
        app.get('/register', (req, res, next) => this.authService.authenticationMiddleware(req, res, next), this.authService.verifyAcl(this.scannerAcl, rbac_types_1.AclOperations.CREATE), (req, res, next) => this.registerNewScannerHandler(res, next));
        app.get('/events', (req, res, next) => this.verifyScannerPermissionsMiddleware(req, res, next, rbac_types_1.AclOperations.READ_ALL), (req, res, next) => this.getNextEventsHandler(res, next));
        app.post('/register', (req, res, next) => this.confirmRegisterScannerHandler(req, res, next));
        app.get('/registrations', (req, res, next) => this.verifyScannerPermissionsMiddleware(req, res, next, rbac_types_1.AclOperations.READ_ALL), (req, res, next) => this.getAllRegistrationsHandler(res, next));
    }
    /**
     * @api {get} /admin/scanner/register Start a scanner registration
     * @apiVersion 2.0.0
     * @apiName Start a scanner registration
     * @apiDescription NOTE: This method is rate-limited to 200 rpm
     * @apiGroup Admin Scanner
     * @apiPermission TeamMemberPermission
     * @apiSuccess {PinToken} Pin Token containing temporary authentication pin, validity, and other metadata
     * @apiUse ResponseBodyDescription
     * @apiUse AuthArgumentRequired
     * @apiUse IllegalArgumentError
     * @apiUse ResponseBodyDescription
     */
    registerNewScannerHandler(response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const pinToken = yield this.scannerAuthService.generatePinAuthenticator();
                return this.sendResponse(response, new __1.ResponseBody('Success', 200, { result: 'Success', data: pinToken }));
            }
            catch (error) {
                return util_1.Util.errorHandler500(error, next);
            }
        });
    }
    /**
     * @api {post} /admin/scanner/assign Assign RFID tags ID to users
     * @apiVersion 2.0.0
     * @apiName Assign an RFID to a user (Admin)
     *
     * @apiGroup Admin Scanner
     * @apiPermission TeamMemberPermission
     *
     * @apiUse AuthArgumentRequired
     * @apiParam {Array} assignments An array or single instance of RFID tags to User uid assignments
     * @apiParamExample {json} Request-Example:
     *     [
     *      {
     *       "rfid": "1vyv2boy1v3b4oi12-1234lhb1234b",
     *       "uid": "nbG7b87NB87nB7n98Y7",
     *       "time": 1239712938120
     *     },
     *     { ... }
     *     ]
     * @apiSuccess {RfidAssignment[]} Array of rfid insertion results
     * @apiUse IllegalArgumentError
     * @apiPermission ScannerPermission
     * @apiUse ResponseBodyDescription
     */
    addRfidAssignments(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            // Validate incoming request
            if (!req.body) {
                return util_1.Util.standardErrorHandler(new errors_1.HttpError('Illegal request format', 400), next);
            }
            if (!req.body.assignments) {
                return util_1.Util.standardErrorHandler(new errors_1.HttpError('Cannot find assignment(s) to add', 400), next);
            }
            try {
                const response = yield this.scannerProcessor.processRfidAssignments(req.body.assignments);
                return this.sendResponse(res, response);
            }
            catch (error) {
                return util_1.Util.standardErrorHandler(error, next);
            }
        });
    }
    /**
     * @api {post} /admin/scanner/register Confirm a scanner registration
     * @apiVersion 2.0.0
     * @apiName Confirm a scanner registration
     *
     * @apiGroup Admin Scanner
     * @apiPermission ScannerPermission
     * @apiParam pin {number} A pin generated by calling the GET: /register route
     * @apiParam macaddr {string} Mac Address of the device registering for API Key
     * @apiSuccess {ApiToken} API Token containing api key, validity, and other metadata
     * @apiUse ResponseBodyDescription
     * @apiUse AuthArgumentRequired
     * @apiUse IllegalArgumentError
     * @apiUse ResponseBodyDescription
     */
    confirmRegisterScannerHandler(request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            // Validate incoming request
            if (!request.body) {
                return util_1.Util.standardErrorHandler(new errors_1.HttpError('Illegal request format', 400), next);
            }
            if (!request.body.pin || !parseInt(request.body.pin, 10)) {
                return util_1.Util.standardErrorHandler(new errors_1.HttpError('could not find authentication pin', 400), next);
            }
            if (!request.headers.macaddr) {
                return util_1.Util.standardErrorHandler(new errors_1.HttpError('could not find mac address of device', 400), next);
            }
            try {
                const res = yield this.scannerProcessor.processorScannerConfirmation(parseInt(request.body.pin, 10), request.headers.macaddr);
                return this.sendResponse(response, res);
            }
            catch (error) {
                return util_1.Util.standardErrorHandler(error, next);
            }
        });
    }
    /**
     * @api {get} /admin/scanner/registrations Obtain all registrations
     * @apiVersion 2.0.0
     * @apiName Obtain all registrations (Scanner)
     *
     * @apiGroup Admin Scanner
     * @apiPermission TeamMemberPermission
     * @apiPermission ScannerPermission
     * @apiUse AuthArgumentRequired
     * @apiSuccess {Registration[]} Array of current registrations
     * @apiUse IllegalArgumentError
     * @apiUse ResponseBodyDescription
     */
    getAllRegistrationsHandler(res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            let result;
            try {
                result = yield this.adminStatisticsDataMapper.getAllUserData({
                    byHackathon: true,
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
     * @api {get} /admin/scanner/events Obtain relevant events
     * @apiVersion 2.0.0
     * @apiName Obtain all relevant events (Scanner)
     *
     * @apiGroup Admin Scanner
     * @apiPermission TeamMemberPermission
     * @apiPermission ScannerPermission
     * @apiUse AuthArgumentRequired
     * @apiSuccess {Event[]} Array of current events
     * @apiUse IllegalArgumentError
     * @apiUse ResponseBodyDescription
     */
    getNextEventsHandler(res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.scannerProcessor.getRelevantEvents();
                return this.sendResponse(res, response);
            }
            catch (error) {
                return util_1.Util.errorHandler500(error, next);
            }
        });
    }
};
AdminScannerController = __decorate([
    injection_js_1.Injectable(),
    __param(0, injection_js_1.Inject('IAdminStatisticsDataMapper')),
    __param(1, injection_js_1.Inject('IAdminScannerProcessor')),
    __param(2, injection_js_1.Inject('IActiveHackathonDataMapper')),
    __param(3, injection_js_1.Inject('IAuthService')),
    __param(4, injection_js_1.Inject('IScannerAuthService')),
    __param(5, injection_js_1.Inject('IScannerDataMapper')),
    __param(6, injection_js_1.Inject('IScannerDataMapper')),
    __param(7, injection_js_1.Inject('IRegisterDataMapper')),
    __metadata("design:paramtypes", [Object, Object, Object, Object, Object, Object, Object, Object])
], AdminScannerController);
exports.AdminScannerController = AdminScannerController;
//# sourceMappingURL=admin-scanner.js.map