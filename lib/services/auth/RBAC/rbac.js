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
Object.defineProperty(exports, "__esModule", { value: true });
const injection_js_1 = require("injection-js");
require("reflect-metadata");
let RBAC = class RBAC {
    constructor() {
        this.roles = new Map();
    }
    registerRBAC(role) {
        if (this.roles.has(role.name)) {
            this.roles.get(role.name).merge(role);
        }
        else {
            this.roles.set(role.name, role);
        }
    }
    can(role, operation, params) {
        if (!this.roles.has(role))
            return false;
        const registeredRole = this.roles.get(role);
        if (registeredRole.capability.has(operation)) {
            if (registeredRole.action) {
                return registeredRole.action(params);
            }
            return true;
        }
        return registeredRole.inherits ? [...registeredRole.inherits].some(inherit => this.can(inherit, operation, params)) : false;
    }
    printDebugInformation(logger) {
        logger.info(Array.from(this.roles.values()).join(' | '));
    }
};
RBAC = __decorate([
    injection_js_1.Injectable(),
    __metadata("design:paramtypes", [])
], RBAC);
exports.RBAC = RBAC;
//# sourceMappingURL=rbac.js.map