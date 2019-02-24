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
const injection_js_1 = require("injection-js");
const errors_1 = require("../../../JSCommon/errors");
const util_1 = require("../../../JSCommon/util");
const update_1 = require("../../../models/update/update");
const rbac_types_1 = require("../../../services/auth/RBAC/rbac-types");
const logging_1 = require("../../../services/logging/logging");
const router_types_1 = require("../../router-types");
const controllers_1 = require("../controllers");
let UpdatesController = class UpdatesController extends controllers_1.LiveController {
    constructor(authService, updateProcessor, updateDataMapper, acl, logger) {
        super();
        this.authService = authService;
        this.updateProcessor = updateProcessor;
        this.updateDataMapper = updateDataMapper;
        this.acl = acl;
        this.logger = logger;
        this.routes(this.router);
    }
    routes(app) {
        if (!this.authService || !this.updateDataMapper || !this.acl) {
            return;
        }
        // Unauthenticated route
        app.get('/reference', (req, res, next) => this.getUpdateReferenceHandler(res, next));
        // Use authentication
        app.use((req, res, next) => this.authService.authenticationMiddleware(req, res, next));
        // Authenticated routes
        app
            .get('/', this.authService.verifyAcl(this.acl, rbac_types_1.AclOperations.READ), (req, res, next) => this.getUpdateHandler(res, next))
            .post('/', this.authService.verifyAcl(this.acl, rbac_types_1.AclOperations.CREATE), (req, res, next) => this.postUpdateHandler(req, res, next))
            .post('/update', this.authService.verifyAcl(this.acl, rbac_types_1.AclOperations.UPDATE), (req, res, next) => this.updateEventHandler(req, res, next))
            .post('/delete', this.authService.verifyAcl(this.acl, rbac_types_1.AclOperations.DELETE), (req, res, next) => this.deleteEventHandler(req, res, next));
    }
    deleteEventHandler(request, response, next) {
        next(new errors_1.RouteNotImplementedError('Update deletion is not supported at this time'));
    }
    updateEventHandler(request, response, next) {
        next(new errors_1.RouteNotImplementedError('Update editing is not supported at this time'));
    }
    /**
     * @api {post} /live/updates/ Add a new update
     * @apiVersion 2.0.0
     * @apiName New update
     * @apiGroup Updates
     * @apiPermission TeamMemberPermission
     *
     * @apiParam {String} updateTitle - The title of the update
     * @apiParam {String} updateText - The text of the update
     * @apiParam {String} [updateImage] - The url of the image part of the update.
     * @apiParam {Boolean} [pushNotification] - Whether to send out a push notification with this update.
     * @apiUse AuthArgumentRequired
     * @apiSuccess {Update} The added update
     * @apiUse IllegalArgumentError
     * @apiUse ResponseBodyDescription
     */
    postUpdateHandler(request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!request.body || !request.body.updateTitle) {
                return next(new errors_1.HttpError('Update title must be provided', 400));
            }
            if (!request.body.updateText) {
                return next(new errors_1.HttpError('Update message must be provided', 400));
            }
            if (!request.body.updateImage) {
                request.body.updateImage = 'https://app.hackpsu.org/assets/images/logo.svg';
            }
            const generatedUpdate = new update_1.Update(request.body);
            try {
                const res = yield this.updateProcessor.processUpdate(generatedUpdate);
                return this.sendResponse(response, res);
            }
            catch (error) {
                return util_1.Util.errorHandler500(error, next);
            }
        });
    }
    /**
     * This function gets the Firebase Database reference for live updates
     * @api {get} /live/updates/reference Get the db reference for updates
     * @apiVersion 2.0.0
     * @apiName Get Update reference
     * @apiGroup Updates
     *
     * @apiSuccess {String} The database reference to the current updates.
     * @apiUse ResponseBodyDescription
     */
    getUpdateReferenceHandler(response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const reference = yield this.updateDataMapper.getReference();
                const res = new router_types_1.ResponseBody('Success', 200, reference);
                return this.sendResponse(response, res);
            }
            catch (error) {
                return util_1.Util.errorHandler500(error, next);
            }
        });
    }
    /**
     * @api {get} /live/updates/ Get all the updates
     * @apiVersion 2.0.0
     * @apiName Get Updates
     * @apiGroup Updates
     * @apiPermission UserPermission
     *
     * @apiUse AuthArgumentRequired
     *
     * @apiSuccess {Update[]} Array of current updates.
     * @apiUse ResponseBodyDescription
     */
    getUpdateHandler(response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const stream = yield this.updateDataMapper.getAll();
                const res = new router_types_1.ResponseBody('Success', 200, stream);
                return this.sendResponse(response, res);
            }
            catch (error) {
                return util_1.Util.errorHandler500(error, next);
            }
        });
    }
};
UpdatesController.baseRoute = 'updates/';
UpdatesController = __decorate([
    injection_js_1.Injectable(),
    __param(0, injection_js_1.Inject('IAuthService')),
    __param(1, injection_js_1.Inject('IUpdateProcessor')),
    __param(2, injection_js_1.Inject('IUpdateDataMapper')),
    __param(3, injection_js_1.Inject('IUpdateDataMapper')),
    __param(4, injection_js_1.Inject('BunyanLogger')),
    __metadata("design:paramtypes", [Object, Object, Object, Object, logging_1.Logger])
], UpdatesController);
exports.UpdatesController = UpdatesController;
//# sourceMappingURL=updates.js.map