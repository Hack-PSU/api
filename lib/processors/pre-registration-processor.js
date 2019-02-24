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
const router_types_1 = require("../router/router-types");
/**
 * This class handles any processing functions the Api needs
 */
let PreRegistrationProcessor = class PreRegistrationProcessor {
    constructor(preRegDataMapper) {
        this.preRegDataMapper = preRegDataMapper;
    }
    processPreregistration(preRegistration) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.preRegDataMapper.insert(preRegistration);
            return new router_types_1.ResponseBody('Success', 200, { result: 'Success', data: { preRegistration, result } });
        });
    }
};
PreRegistrationProcessor = __decorate([
    injection_js_1.Injectable(),
    __param(0, injection_js_1.Inject('IPreRegisterDataMapper')),
    __metadata("design:paramtypes", [Object])
], PreRegistrationProcessor);
exports.PreRegistrationProcessor = PreRegistrationProcessor;
//# sourceMappingURL=pre-registration-processor.js.map