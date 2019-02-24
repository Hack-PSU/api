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
const event_1 = require("../../../models/event/event");
const rbac_types_1 = require("../../../services/auth/RBAC/rbac-types");
const logging_1 = require("../../../services/logging/logging");
const router_types_1 = require("../../router-types");
const controllers_1 = require("../controllers");
let EventsController = class EventsController extends controllers_1.LiveController {
    constructor(authService, dataMapper, aclPerm, logger) {
        super();
        this.authService = authService;
        this.dataMapper = dataMapper;
        this.aclPerm = aclPerm;
        this.logger = logger;
        this.routes(this.router);
    }
    routes(app) {
        if (!this.authService) {
            return;
        }
        if (!this.dataMapper) {
            return;
        }
        // Unauthenticated route
        app.get('/', (req, res, next) => this.getEventHandler(req, res, next));
        // Use authentication
        app.use((req, res, next) => this.authService.authenticationMiddleware(req, res, next));
        // Authenticated routes
        app
            .post('/', this.authService.verifyAcl(this.aclPerm, rbac_types_1.AclOperations.CREATE), (req, res, next) => this.postEventHandler(req, res, next))
            .post('/update', this.authService.verifyAcl(this.aclPerm, rbac_types_1.AclOperations.UPDATE), (req, res, next) => this.updateEventHandler(req, res, next))
            .post('/delete', this.authService.verifyAcl(this.aclPerm, rbac_types_1.AclOperations.DELETE), (req, res, next) => this.deleteEventHandler(req, res, next));
    }
    /**
     * Delete an event
     * @api {post} /live/event/delete Delete an existing event
     * @apiVersion 2.0.0
     * @apiName Update Event
     * @apiGroup Events
     * @apiPermission TeamMemberPermission
     *
     * @apiParam {String} uid - The uid of the event.
     * @apiUse AuthArgumentRequired
     * @apiUse IllegalArgumentError
     * @apiUse ResponseBodyDescription
     */
    deleteEventHandler(request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!request.body || !request.body.uid) {
                return next(new errors_1.HttpError('Event uid must be provided', 400));
            }
            try {
                yield this.dataMapper.delete(request.body.uid);
                const res = new router_types_1.ResponseBody('Success', 200, request.body.uid);
                return this.sendResponse(response, res);
            }
            catch (error) {
                util_1.Util.standardErrorHandler(error, next);
            }
        });
    }
    /**
     * Updates an existing event
     * @api {post} /live/event/update Update an existing event
     * @apiVersion 2.0.0
     * @apiName Update Event
     * @apiGroup Events
     * @apiPermission TeamMemberPermission
     *
     * @apiParam {String} uid - The uid of the event.
     * @apiParam {String} eventLocation - The uid of the location for the event.
     * @apiParam {String} eventStartTime - The unix time for the start of the event.
     * @apiParam {String} eventEndTime - The unix time for the start of the event.
     * @apiParam {String} eventTitle - The title of the event.
     * @apiParam {String} eventDescription - The description of the event.
     * @apiParam {Enum} eventType - The type of the event. Accepted values: ["food","workshop","activity"]
     * @apiUse AuthArgumentRequired
     * @apiSuccess {Event} The updated event
     * @apiUse IllegalArgumentError
     * @apiUse ResponseBodyDescription
     */
    updateEventHandler(request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!request.body || !request.body.event) {
                return next(new errors_1.HttpError('No event provided to update', 400));
            }
            let event;
            try {
                event = new event_1.Event(request.body);
            }
            catch (error) {
                return util_1.Util.standardErrorHandler(new errors_1.HttpError('Some properties were not as expected', 401), next);
            }
            try {
                yield this.dataMapper.update(event);
                const res = new router_types_1.ResponseBody('Success', 200, { result: 'Success', data: event });
                return this.sendResponse(response, res);
            }
            catch (error) {
                return util_1.Util.errorHandler500(error, next);
            }
        });
    }
    /**
     * Create a new event
     * @api {post} /live/event/ Add a new event
     * @apiVersion 2.0.0
     * @apiName New Event
     * @apiGroup Events
     * @apiPermission TeamMemberPermission
     *
     * @apiParam {String} eventLocation - The uid of the location for the event.
     * @apiParam {String} eventStartTime - The unix time for the start of the event.
     * @apiParam {String} eventEndTime - The unix time for the start of the event.
     * @apiParam {String} eventTitle - The title of the event.
     * @apiParam {String} eventDescription - The description of the event.
     * @apiParam {Enum} eventType - The type of the event. Accepted values: ["food","workshop","activity"]
     * @apiParam {String} [hackathon] - optional uid of hackathon
     * @apiUse AuthArgumentRequired
     * @apiSuccess {Event} The inserted event
     * @apiUse IllegalArgumentError
     * @apiUse ResponseBodyDescription
     */
    postEventHandler(request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!request.body.eventLocation) {
                return next(new errors_1.HttpError('Event location must be provided', 400));
            }
            if (!request.body.eventStartTime) {
                return next(new errors_1.HttpError('Event start time must be provided', 400));
            }
            if (!request.body.eventEndTime) {
                return next(new errors_1.HttpError('Event end time must be provided', 400));
            }
            if (!request.body.eventTitle) {
                return next(new errors_1.HttpError('Event title must be provided', 400));
            }
            if (!request.body.eventDescription) {
                return next(new errors_1.HttpError('Event description must be provided', 400));
            }
            if (!request.body.eventType) {
                return next(new errors_1.HttpError('Event type must be provided', 400));
            }
            let event;
            try {
                event = new event_1.Event(request.body);
            }
            catch (error) {
                return util_1.Util.standardErrorHandler(new errors_1.HttpError('Some properties were not as expected', 400), next);
            }
            try {
                const result = yield this.dataMapper.insert(event);
                const res = new router_types_1.ResponseBody('Success', 200, { result: 'Success', data: result });
                return this.sendResponse(response, res);
            }
            catch (error) {
                return util_1.Util.errorHandler500(error, next);
            }
        });
    }
    /**
     * This function gets all the events for the current hackathon
     * @api {get} /live/events/ Get all the events
     * @apiVersion 2.0.0
     * @apiName Get events
     * @apiGroup Events
     * @apiUse RequestOpts
     * @apiSuccess {Event[]} Array of current events
     * @apiUse ResponseBodyDescription
     */
    getEventHandler(request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const stream = yield this.dataMapper.getAll({
                    byHackathon: !request.query.allHackathons,
                    count: request.query.limit,
                    hackathon: request.query.hackathon,
                    startAt: request.query.offset,
                });
                const res = new router_types_1.ResponseBody('Success', 200, stream);
                return this.sendResponse(response, res);
            }
            catch (error) {
                return util_1.Util.errorHandler500(error, next);
            }
        });
    }
};
EventsController.baseRoute = 'events/';
EventsController = __decorate([
    injection_js_1.Injectable(),
    __param(0, injection_js_1.Inject('IAuthService')),
    __param(1, injection_js_1.Inject('IEventDataMapper')),
    __param(2, injection_js_1.Inject('IEventDataMapper')),
    __param(3, injection_js_1.Inject('BunyanLogger')),
    __metadata("design:paramtypes", [Object, Object, Object, logging_1.Logger])
], EventsController);
exports.EventsController = EventsController;
//# sourceMappingURL=events.js.map