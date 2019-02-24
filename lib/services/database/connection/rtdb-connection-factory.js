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
Object.defineProperty(exports, "__esModule", { value: true });
const injection_js_1 = require("injection-js");
const firebase_service_1 = require("../../common/firebase/firebase.service");
let RtdbConnectionFactory = class RtdbConnectionFactory {
    constructor(firebaseService) {
        this.firebaseService = firebaseService;
    }
    getDatabase() {
        return this.firebaseService.admin.database();
    }
};
RtdbConnectionFactory = __decorate([
    injection_js_1.Injectable(),
    __param(0, injection_js_1.Inject('FirebaseService')),
    __metadata("design:paramtypes", [firebase_service_1.FirebaseService])
], RtdbConnectionFactory);
exports.RtdbConnectionFactory = RtdbConnectionFactory;
//# sourceMappingURL=rtdb-connection-factory.js.map