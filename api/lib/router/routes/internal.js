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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var InternalController_1;
const express_1 = __importDefault(require("express"));
const injection_js_1 = require("injection-js");
const __1 = require("..");
const errors_1 = require("../../JSCommon/errors");
const logging_1 = require("../../services/logging/logging");
const router_types_1 = require("../router-types");
// const Metrics = require('../../services/logging/monitoring');
let InternalController = InternalController_1 = class InternalController extends router_types_1.ParentRouter {
    constructor(acl, logger) {
        super();
        this.acl = acl;
        this.logger = logger;
        this.router = express_1.default.Router();
        this.routes(this.router);
    }
    static internalVerifier(request, response, next) {
        if (!request.headers['x-appengine-cron']) {
            const error = new errors_1.HttpError('You cannot call internal URLs', 401);
            return next(error);
        }
        return next();
    }
    routes(app) {
        app.use((req, res, next) => InternalController_1.internalVerifier(req, res, next));
        app.get('/rbac', (req, res) => this.rbacDebug(res));
    }
    rbacDebug(res) {
        this.acl.printDebugInformation(this.logger);
        return this.sendResponse(res, new __1.ResponseBody('Success', 200, { result: 'Success', data: 'printed debug information' }));
    }
};
InternalController.baseRoute = 'internal/';
InternalController = InternalController_1 = __decorate([
    injection_js_1.Injectable(),
    __param(0, injection_js_1.Inject('IAcl')),
    __param(1, injection_js_1.Inject('BunyanLogger')),
    __metadata("design:paramtypes", [Object, logging_1.Logger])
], InternalController);
exports.InternalController = InternalController;
//# sourceMappingURL=internal.js.map