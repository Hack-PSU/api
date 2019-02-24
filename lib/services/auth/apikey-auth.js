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
var ApikeyAuthService_1;
const injection_js_1 = require("injection-js");
const moment_1 = __importDefault(require("moment"));
const random_number_csprng_1 = __importDefault(require("random-number-csprng"));
const v4_1 = __importDefault(require("uuid/v4"));
const errors_1 = require("../../JSCommon/errors");
const rate_limiter_service_1 = require("../common/rate-limiter/rate-limiter.service");
let ApikeyAuthService = ApikeyAuthService_1 = class ApikeyAuthService {
    constructor(firebaseService, rateLimiterService) {
        this.firebaseService = firebaseService;
        this.rateLimiterService = rateLimiterService;
        this.APIKEY_COLLECTION = 'apikey';
        this.PINS_COLLECTION = 'pins';
        this.db = this.firebaseService.admin.firestore();
        this.rateLimiter = rateLimiterService.instance(200);
    }
    static validateApiToken(apiToken) {
        return apiToken.valid && moment_1.default(apiToken.expiryTime).isAfter(moment_1.default());
    }
    static validatePinAuthenticator(pin) {
        return pin.valid && moment_1.default(pin.expiryTime).isAfter(moment_1.default());
    }
    checkAuthentication(token, macAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = yield this.db.collection(this.APIKEY_COLLECTION).doc(token).get();
            if (!doc.exists) {
                throw new errors_1.HttpError('invalid API key', 404);
            }
            const apiToken = doc.data();
            if (apiToken.macAddress !== macAddress)
                throw new errors_1.HttpError('MAC addres did not match', 401);
            if (ApikeyAuthService_1.validateApiToken(apiToken)) {
                return true;
            }
            throw new errors_1.HttpError('API key has expired', 401);
        });
    }
    generateApiKey(macAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = v4_1.default();
            const apiToken = {
                key,
                macAddress,
                expiryTime: moment_1.default().add(7, 'days').valueOf(),
                mintTime: moment_1.default().valueOf(),
                valid: true,
            };
            yield this.db.collection(this.APIKEY_COLLECTION).doc(key).set(apiToken);
            return apiToken;
        });
    }
    generatePinAuthenticator() {
        return __awaiter(this, void 0, void 0, function* () {
            const pin = yield random_number_csprng_1.default(0, 1000);
            const pinToken = {
                pin,
                expiryTime: moment_1.default().add(5, 'minutes').valueOf(),
                mintTime: moment_1.default().valueOf(),
                valid: true,
            };
            yield this.db.collection(this.PINS_COLLECTION).doc(pin.toString()).set(pinToken);
            return pinToken;
        });
    }
    checkPinAuthentication(pin) {
        return __awaiter(this, void 0, void 0, function* () {
            this.rateLimiter.makeRequest();
            const doc = yield this.db.collection(this.PINS_COLLECTION).doc(pin.toString()).get();
            if (!doc.exists) {
                return false;
            }
            const apiToken = doc.data();
            const result = ApikeyAuthService_1.validatePinAuthenticator(apiToken);
            yield this.db.collection(this.PINS_COLLECTION).doc(pin.toString()).delete();
            return result;
        });
    }
};
ApikeyAuthService = ApikeyAuthService_1 = __decorate([
    injection_js_1.Injectable(),
    __param(0, injection_js_1.Inject('FirebaseService')),
    __param(1, injection_js_1.Inject('RateLimiterService')),
    __metadata("design:paramtypes", [Object, rate_limiter_service_1.RateLimiterService])
], ApikeyAuthService);
exports.ApikeyAuthService = ApikeyAuthService;
//# sourceMappingURL=apikey-auth.js.map