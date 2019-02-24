"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_types_1 = require("../../auth/auth-types");
const Role_1 = require("../../auth/RBAC/Role");
class GenericDataMapper {
    constructor(acl) {
        this.acl = acl;
    }
    addRBAC(role, levels, action, inherits) {
        levels.forEach(level => this.acl.registerRBAC(new Role_1.Role(auth_types_1.AuthLevel[level], Array.isArray(role) ? role : [role], action, inherits)));
    }
}
exports.GenericDataMapper = GenericDataMapper;
//# sourceMappingURL=generic-data-mapper.js.map