"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rbac_1 = require("../RBAC/rbac");
exports.RBAC = rbac_1.RBAC;
var AuthLevel;
(function (AuthLevel) {
    AuthLevel[AuthLevel["PARTICIPANT"] = 0] = "PARTICIPANT";
    AuthLevel[AuthLevel["VOLUNTEER"] = 1] = "VOLUNTEER";
    AuthLevel[AuthLevel["TEAM_MEMBER"] = 2] = "TEAM_MEMBER";
    AuthLevel[AuthLevel["DIRECTOR"] = 3] = "DIRECTOR";
    AuthLevel[AuthLevel["TECHNOLOGY"] = 4] = "TECHNOLOGY";
    AuthLevel[AuthLevel["FINANCE"] = 5] = "FINANCE";
})(AuthLevel = exports.AuthLevel || (exports.AuthLevel = {}));
//# sourceMappingURL=index.js.map