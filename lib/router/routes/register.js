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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const email_validator_1 = require("email-validator");
const express_1 = __importDefault(require("express"));
const injection_js_1 = require("injection-js");
const operators_1 = require("rxjs/operators");
const errors_1 = require("../../JSCommon/errors");
const util_1 = require("../../JSCommon/util");
const register_1 = require("../../models/register");
const pre_registration_1 = require("../../models/register/pre-registration");
const rbac_types_1 = require("../../services/auth/RBAC/rbac-types");
const logging_1 = require("../../services/logging/logging");
const router_types_1 = require("../router-types");
let RegistrationController = class RegistrationController extends router_types_1.ParentRouter {
    constructor(authService, registrationProcessor, preregistrationProcessor, aclPerm, activeHackathonDataMapper, storageService, logger) {
        super();
        this.authService = authService;
        this.registrationProcessor = registrationProcessor;
        this.preregistrationProcessor = preregistrationProcessor;
        this.aclPerm = aclPerm;
        this.activeHackathonDataMapper = activeHackathonDataMapper;
        this.storageService = storageService;
        this.logger = logger;
        this.router = express_1.default.Router();
        this.routes(this.router);
    }
    routes(app) {
        // Unauthenticated routes
        app.post('/pre', (req, res, next) => this.preRegistrationHandler(req, res, next));
        // Use authentication
        app.use((req, res, next) => this.authService.authenticationMiddleware(req, res, next));
        // Authenticated routes
        app
            .post('/', this.authService.verifyAcl(this.aclPerm, rbac_types_1.AclOperations.CREATE), (req, res, next) => this.storageService.upload(req, res, next), (req, res, next) => this.registrationHandler(req, res, next));
    }
    generateFileName(uid, firstName, lastName) {
        return __awaiter(this, void 0, void 0, function* () {
            return `${uid}-${firstName}-${lastName}-${yield this.activeHackathonDataMapper.activeHackathon.pipe(operators_1.map(hackathon => hackathon.uid)).toPromise()}.pdf`;
        });
    }
    validateRegistrationFields(registration) {
        if (!registration) {
            this.logger.error('No registration provided');
            throw new errors_1.HttpError('No registration provided', 400);
        }
        if (!email_validator_1.validate(registration.email)) {
            this.logger.error('IEmail used for registration is invalid');
            throw new errors_1.HttpError('IEmail used for registration is invalid', 400);
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
     * @api {post} /register/pre Preregister for HackPSU
     * @apiVersion 2.0.0
     * @apiName Add Pre-Registration
     * @apiGroup Pre Registration
     * @apiParam {String} email The email ID to register with
     * @apiSuccess {PreRegistration} The inserted pre registration
     * @apiUse IllegalArgumentError
     * @apiUse ResponseBodyDescription
     */
    preRegistrationHandler(request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!request.body ||
                !request.body.email ||
                !email_validator_1.validate(request.body.email)) {
                return next(new errors_1.HttpError('Valid email must be provided', 400));
            }
            let preRegistration;
            try {
                preRegistration = new pre_registration_1.PreRegistration(request.body.email);
            }
            catch (error) {
                return util_1.Util.standardErrorHandler(new errors_1.HttpError('Some properties were not as expected', 400), next);
            }
            try {
                const res = yield this.preregistrationProcessor.processPreregistration(preRegistration);
                return this.sendResponse(response, res);
            }
            catch (error) {
                return util_1.Util.errorHandler500(error, next);
            }
        });
    }
    /**
     * @api {post} /register/ Register for HackPSU
     * @apiVersion 2.0.0
     * @apiName Add Registration
     * @apiGroup Registration
     * @apiPermission UserPermission
     * @apiUse AuthArgumentRequired
     * @apiParam {String} firstName First name of the user
     * @apiParam {String} lastName Last name of the user
     * @apiParam {String} gender Gender of the user
     * @apiParam {enum} shirtSize [XS, S, M, L, XL, XXL]
     * @apiParam {String} [dietaryRestriction] The dietary restictions for the user
     * @apiParam {String} [allergies] Any allergies the user might have
     * @apiParam {boolean} travelReimbursement=false
     * @apiParam {boolean} firstHackathon=false Is this the user's first hackathon
     * @apiParam {String} university The university that the user attends
     * @apiParam {String} email The user's school email
     * @apiParam {String} academicYear The user's current year in school
     * @apiParam {String} major Intended or current major
     * @apiParam {String} phone The user's phone number (For MLH)
     * @apiParam {FILE} [resume] The resume file for the user (Max size: 10 MB)
     * @apiParam {String} [ethnicity] The user's ethnicity
     * @apiParam {String} codingExperience The coding experience that the user has
     * @apiParam {String} uid The UID from their Firebase account
     * @apiParam {boolean} eighteenBeforeEvent=true Will the person be eighteen before the event
     * @apiParam {boolean} mlhcoc=true Does the user agree to the mlhcoc?
     * @apiParam {boolean} mlhdcp=true Does the user agree to the mlh dcp?
     * @apiParam {String} referral Where did the user hear about the Hackathon?
     * @apiParam {String} project A project description that the user is proud of
     * @apiParam {String} expectations What the user expects to get from the hackathon
     * @apiParam {String} veteran=false Is the user a veteran?
     *
     * @apiSuccess {Registration} The inserted registration
     * @apiUse IllegalArgumentError
     * @apiUse ResponseBodyDescription
     */
    registrationHandler(request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            // Validate incoming registration
            try {
                this.registrationProcessor.normaliseRegistrationData(request.body);
                request.body.uid = response.locals.user.uid;
                request.body.email = response.locals.user.email;
                this.validateRegistrationFields(request.body);
            }
            catch (error) {
                return util_1.Util.standardErrorHandler(new errors_1.HttpError(error.toString(), 400), next);
            }
            // Save registration
            if (request.file) {
                request.body.resume = this.storageService.uploadedFileUrl(yield this.generateFileName(request.body.uid, request.body.firstName, request.body.lastName));
            }
            let registration;
            try {
                registration = new register_1.Registration(request.body);
            }
            catch (error) {
                return util_1.Util.standardErrorHandler(new errors_1.HttpError('Some properties were not as expected', 400), next);
            }
            try {
                const res = yield this.registrationProcessor.processRegistration(registration);
                return this.sendResponse(response, res);
            }
            catch (error) {
                return util_1.Util.errorHandler500(error, next);
            }
        });
    }
};
RegistrationController = __decorate([
    injection_js_1.Injectable(),
    __param(0, injection_js_1.Inject('IAuthService')),
    __param(1, injection_js_1.Inject('IRegistrationProcessor')),
    __param(2, injection_js_1.Inject('IPreregistrationProcessor')),
    __param(3, injection_js_1.Inject('IRegisterDataMapper')),
    __param(4, injection_js_1.Inject('IActiveHackathonDataMapper')),
    __param(5, injection_js_1.Inject('IStorageService')),
    __param(6, injection_js_1.Inject('BunyanLogger')),
    __metadata("design:paramtypes", [Object, Object, Object, Object, Object, Object, logging_1.Logger])
], RegistrationController);
exports.RegistrationController = RegistrationController;
//# sourceMappingURL=register.js.map