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
const errors_1 = require("../../../JSCommon/errors");
const rbac_types_1 = require("../../../services/auth/RBAC/rbac-types");
const logging_1 = require("../../../services/logging/logging");
const router_types_1 = require("../../router-types");
let AdminLocationController = class AdminLocationController extends router_types_1.ParentRouter {
    constructor(authService, locationDataMapper, locationAcl, adminAcl, logger) {
        super();
        this.authService = authService;
        this.locationDataMapper = locationDataMapper;
        this.locationAcl = locationAcl;
        this.adminAcl = adminAcl;
        this.logger = logger;
        this.router = express_1.Router();
        this.routes(this.router);
    }
    routes(app) {
        app.get('/', this.authService.verifyAcl(this.locationAcl, rbac_types_1.AclOperations.READ_ALL), (req, res, next) => this.getAllLocationsHandler(res, next));
        app.post('/', this.authService.verifyAcl(this.locationAcl, rbac_types_1.AclOperations.CREATE), (req, res, next) => this.createLocationHandler(req, res, next));
        app.post('/update', this.authService.verifyAcl(this.locationAcl, rbac_types_1.AclOperations.CREATE), (req, res, next) => this.updateLocationHandler(req, res, next));
        app.post('/delete', this.authService.verifyAcl(this.locationAcl, rbac_types_1.AclOperations.DELETE), (req, res, next) => this.deleteLocationHandler(req, res, next));
    }
    /**
     * @api {get} /admin/location Get the list of existing locations
     * @apiVersion 2.0.0
     * @apiName Get Location List
     * @apiGroup Admin Location
     * @apiPermission DirectorPermission
     *
     * // TODO: Update when implemented
     * @apiDescription NOTE: This route is not implemented yet
     * @apiUse AuthArgumentRequired
     * @apiSuccess {Location[]} Array of locations
     * @apiUse ResponseBodyDescription
     */
    getAllLocationsHandler(res, next) {
        // Location.getAll(req.uow, {
        //   count: res.locals.limit,
        //   startAt: res.locals.offset,
        // })
        //   .then(stream => streamHandler(stream, res, next))
        //   .catch(err => errorHandler500(err, next));
        next(new errors_1.HttpError('This is not implemented yet', 501));
    }
    /**
     * @api {post} /admin/location Create a new location
     * @apiVersion 2.0.0
     * @apiName Create Location
     * @apiGroup Admin Location
     * @apiPermission DirectorPermission
     * // TODO: Update when implemented
     * @apiDescription NOTE: This route is not implemented yet
     *
     * @apiParam {String} locationName - the name of the new location that is to be inserted into the database
     * @apiUse AuthArgumentRequired
     * @apiSuccess {Location} The inserted location
     * @apiUse IllegalArgumentError
     * @apiUse ResponseBodyDescription
     */
    createLocationHandler(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            // if (!req.body ||
            //   !req.body.locationName ||
            //   req.body.locationName.length === 0) {
            //   const error = new Error();
            //   error.status = 400;
            //   error.body = 'Require a name for the location';
            //   return next(error);
            // }
            // const location = new Location({ locationName: req.body.locationName }, req.uow);
            // location.add()
            //   .then(() => {
            //     res.status(200)
            //       .send({ status: 'Success' });
            //   })
            //   .catch(errorHandler500);
            next(new errors_1.HttpError('This is not implemented yet', 501));
        });
    }
    /**
     * @api {post} /admin/location/update Update name of a location
     * // TODO: Update when implemented
     * @apiDescription NOTE: This route is not implemented yet
     * @apiVersion 2.0.0
     * @apiName Update Location
     * @apiGroup Admin Location
     * @apiPermission DirectorPermission
     *
     * @apiParam {String} uid - the uid that is having the name of the location associated with this id changed
     * @apiParam {String} locationName - the new name that is being updated with the name associated with the uid
     * @apiUse AuthArgumentRequired
     * @apiSuccess {Location} The updated location
     * @apiUse IllegalArgumentError
     * @apiUse ResponseBodyDescription
     */
    updateLocationHandler(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            // if (!req.body ||
            //   !req.body.uid ||
            //   !req.body.locationName ||
            //   req.body.locationName.length === 0 ||
            //   req.body.uid.length === 0) {
            //   const error = new Error();
            //   error.status = 400;
            //   error.body = 'Require the uid and/or name for the location';
            //   return next(error);
            // }
            // const location = new Location(req.body, req.uow);
            // location.update()
            //   .then(() => {
            //     res.status(200)
            //       .send({ status: 'Success' });
            //   })
            //   .catch(err => errorHandler500(err, next));
            next(new errors_1.HttpError('This is not implemented yet', 501));
        });
    }
    /**
     * @api {post} /admin/location/delete Remove a location
     * @apiVersion 2.0.0
     * @apiName Remove Location
     * @apiGroup Admin Location
     * @apiPermission DirectorPermission
     * // TODO: Update when implemented
     * @apiDescription NOTE: This route is not implemented yet
     *
     * @apiParam {String} uid - the uid of the location that is being selected for removal
     * @apiUse AuthArgumentRequired
     * @apiUse IllegalArgumentError
     * @apiUse ResponseBodyDescription
     */
    deleteLocationHandler(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            // if (!req.body ||
            //   !req.body.uid ||
            //   req.body.uid.length === 0) {
            //   const error = new Error();
            //   error.status = 400;
            //   error.body = 'Require the uid for the location';
            //   return next(error);
            // }
            // const location = new Location({ uid: req.body.uid }, req.uow);
            // location.delete()
            //   .then(() => {
            //     res.status(200)
            //       .send({ status: 'Success' });
            //   })
            //   .catch(err => errorHandler500(err, next));
            next(new errors_1.HttpError('This is not implemented yet', 501));
        });
    }
};
AdminLocationController = __decorate([
    __param(0, injection_js_1.Inject('IAuthService')),
    __param(1, injection_js_1.Inject('ILocationDataMapper')),
    __param(2, injection_js_1.Inject('ILocationDataMapper')),
    __param(3, injection_js_1.Inject('IAdminDataMapper')),
    __param(4, injection_js_1.Inject('BunyanLogger')),
    __metadata("design:paramtypes", [Object, Object, Object, Object, logging_1.Logger])
], AdminLocationController);
exports.AdminLocationController = AdminLocationController;
//# sourceMappingURL=admin-location.js.map