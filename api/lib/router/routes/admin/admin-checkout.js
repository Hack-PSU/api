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
const checkout_object_1 = require("../../../models/checkout-object/checkout-object");
const rbac_types_1 = require("../../../services/auth/RBAC/rbac-types");
const scanner_controller_abstract_1 = require("./scanner-controller-abstract");
let AdminCheckoutController = class AdminCheckoutController extends scanner_controller_abstract_1.ScannerController {
    constructor(authService, scannerAuthService, scannerAcl, scannerDataMapper, registerDataMapper, activeHackathonDataMapper, checkoutObjectDataMapper, checkoutItemsDataMapper, checkoutItemsAcl) {
        super(authService, scannerAuthService, scannerAcl, scannerDataMapper, registerDataMapper, activeHackathonDataMapper);
        this.checkoutObjectDataMapper = checkoutObjectDataMapper;
        this.checkoutItemsDataMapper = checkoutItemsDataMapper;
        this.checkoutItemsAcl = checkoutItemsAcl;
        this.router = express_1.Router();
        this.routes(this.router);
    }
    routes(app) {
        // Get all checked out items
        app.get('/', this.authService.verifyAcl(this.scannerAcl, rbac_types_1.AclOperations.READ_ALL), (req, res, next) => this.getAllCheckoutObjectHandler(res, next));
        // Get all items that can be checked out
        app.get('/items', this.authService.verifyAcl(this.checkoutItemsAcl, rbac_types_1.AclOperations.READ_ALL), (req, res, next) => this.getAllCheckoutItemsHandler(res, next));
        // Create a new checkout request
        app.post('/', (req, res, next) => this.verifyScannerPermissionsMiddleware(req, res, next, rbac_types_1.AclOperations.CREATE), (req, res, next) => this.getUserByRfidBand(req, res, next), (req, res, next) => this.createCheckoutRequestHandler(req, res, next));
        // Return a checked out item
        app.post('/return', (req, res, next) => this.verifyScannerPermissionsMiddleware(req, res, next, rbac_types_1.AclOperations.UPDATE), (req, res, next) => this.returnObjectHandler(req, res, next));
    }
    /**
     * @api {post} /admin/checkout Create a new checkout request
     * @apiVersion 2.0.0
     * @apiName Create new Item Checkout
     * @apiGroup Item Checkout
     * @apiParam {String} itemId The id of the item being checked out
     * @apiParam {String} [userId] The uid of the user checking out the item
     * @apiUse WristbandIdParam
     * @apiDescription This route allows an admin or a scanner to create a new checkout
     * request.
     * NOTE: One of userId or wid must be provided for this route to work
     * @apiUse AuthArgumentRequired
     * @apiPermission TeamMemberPermission
     * @apiSuccess {CheckoutObject} The inserted checkout object
     * @apiUse IllegalArgumentError
     * @apiUse ResponseBodyDescription
     */
    createCheckoutRequestHandler(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            // Validate incoming request
            if (!req.body) {
                return util_1.Util.standardErrorHandler(new errors_1.HttpError('Illegal request format', 400), next);
            }
            if (!req.body.itemId) {
                return util_1.Util.standardErrorHandler(new errors_1.HttpError('Cannot find item ID to checkout', 400), next);
            }
            if (!req.body.userId && !res.locals.registration.id && !res.locals.userToken.uid) {
                return util_1.Util.standardErrorHandler(new errors_1.HttpError('Could not retrieve user ID from provided information', 400), next);
            }
            try {
                const checkoutObject = new checkout_object_1.CheckoutObject({
                    checkout_time: req.body.checkoutTime || Date.now(),
                    item_id: req.body.itemId,
                    user_id: req.body.userId || res.locals.registration.id || res.locals.userToken.uid,
                });
                const result = yield this.checkoutObjectDataMapper.insert(checkoutObject);
                const response = new __1.ResponseBody('Success', 200, result);
                return this.sendResponse(res, response);
            }
            catch (error) {
                return util_1.Util.standardErrorHandler(error, next);
            }
        });
    }
    /**
     * @api {post} /admin/checkout/return Return a checked out item
     * @apiVersion 2.0.0
     * @apiName Return checkout item
     * @apiGroup Item Checkout
     * @apiParam {String} checkoutId The id of the checkout instance
     * @apiParam {number} returnTime=now Epoch time for when the object was returned
     * @apiUse AuthArgumentRequired
     * @apiPermission TeamMemberPermission
     * @apiUse IllegalArgumentError
     * @apiUse ResponseBodyDescription
     */
    returnObjectHandler(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            // Validate incoming request
            if (!req.body) {
                return util_1.Util.standardErrorHandler(new errors_1.HttpError('Illegal request format', 400), next);
            }
            if (!req.body.checkoutId) {
                return util_1.Util.standardErrorHandler(new errors_1.HttpError('Cannot find item ID to checkout', 400), next);
            }
            if (!req.body.returnTime) {
                req.body.returnTime = Date.now();
            }
            try {
                const result = yield this.checkoutObjectDataMapper.returnItem(req.body.returnTime, req.body.checkoutId);
                const response = new __1.ResponseBody('Success', 200, result);
                return this.sendResponse(res, response);
            }
            catch (error) {
                return util_1.Util.standardErrorHandler(error, next);
            }
        });
    }
    /**
     * @api {get} /admin/checkout/ Get all checked out items
     * @apiVersion 2.0.0
     * @apiName Get list of checkout out items
     * @apiGroup Item Checkout
     * @apiUse AuthArgumentRequired
     * @apiPermission TeamMemberPermission
     * @apiSuccess {CheckoutObject[]} All Checkout instances
     * @apiUse IllegalArgumentError
     * @apiUse ResponseBodyDescription
     */
    getAllCheckoutObjectHandler(res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.checkoutObjectDataMapper.getAll({
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
     * @api {get} /admin/checkout/items Get all items available for checkout
     * @apiVersion 2.0.0
     * @apiName Get items for checkout
     * @apiGroup Item Checkout
     * @apiUse AuthArgumentRequired
     * @apiPermission TeamMemberPermission
     * @apiSuccess {CheckoutItem[]} All items in inventory for checkout
     * @apiUse IllegalArgumentError
     * @apiUse ResponseBodyDescription
     */
    getAllCheckoutItemsHandler(res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.checkoutItemsDataMapper.getAll({
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
};
AdminCheckoutController = __decorate([
    injection_js_1.Injectable(),
    __param(0, injection_js_1.Inject('IAuthService')),
    __param(1, injection_js_1.Inject('IScannerAuthService')),
    __param(2, injection_js_1.Inject('ICheckoutObjectDataMapper')),
    __param(3, injection_js_1.Inject('IScannerDataMapper')),
    __param(4, injection_js_1.Inject('IRegisterDataMapper')),
    __param(5, injection_js_1.Inject('IActiveHackathonDataMapper')),
    __param(6, injection_js_1.Inject('ICheckoutObjectDataMapper')),
    __param(7, injection_js_1.Inject('ICheckoutItemsDataMapper')),
    __param(8, injection_js_1.Inject('ICheckoutItemsDataMapper')),
    __metadata("design:paramtypes", [Object, Object, Object, Object, Object, Object, Object, Object, Object])
], AdminCheckoutController);
exports.AdminCheckoutController = AdminCheckoutController;
//# sourceMappingURL=admin-checkout.js.map