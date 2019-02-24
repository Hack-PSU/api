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
var FirebaseAuthService_1;
const email_validator_1 = require("email-validator");
const injection_js_1 = require("injection-js");
require("reflect-metadata");
const errors_1 = require("../../JSCommon/errors");
const util_1 = require("../../JSCommon/util");
const logging_1 = require("../logging/logging");
const auth_types_1 = require("./auth-types/");
const rbac_types_1 = require("./RBAC/rbac-types");
let FirebaseAuthService = FirebaseAuthService_1 = class FirebaseAuthService {
    constructor(firebaseService, acl, logger) {
        this.firebaseService = firebaseService;
        this.acl = acl;
        this.logger = logger;
        this.admin = firebaseService.admin.auth();
    }
    static extractedPermission(requestedOp, permission) {
        let requestPermission;
        switch (requestedOp) {
            case rbac_types_1.AclOperations.CREATE:
                requestPermission = permission.CREATE;
                break;
            case rbac_types_1.AclOperations.UPDATE:
                requestPermission = permission.UPDATE;
                break;
            case rbac_types_1.AclOperations.DELETE:
                requestPermission = permission.DELETE;
                break;
            case rbac_types_1.AclOperations.READ:
                requestPermission = permission.READ;
                break;
            case rbac_types_1.AclOperations.READ_ALL:
                requestPermission = permission.READ_ALL;
                break;
            case rbac_types_1.AclOperations.COUNT:
                requestPermission = permission.COUNT;
                break;
            case rbac_types_1.AclOperations.GET_EMAIL:
                // Only supported for IAdminAclPerm
                requestPermission = permission.GET_EMAIL;
                break;
            case rbac_types_1.AclOperations.MAKE_ACTIVE:
                // Only supported for IAdminAclPerm
                requestPermission = permission.MAKE_ACTIVE;
                break;
            case rbac_types_1.AclOperations.REDUCE_PERMISSION:
                // Only supported for IAdminAclPerm
                requestPermission = permission.REDUCE_PERMISSION;
                break;
            case rbac_types_1.AclOperations.SEND_EMAIL:
                // Only supported for IAdminAclPerm
                requestPermission = permission.SEND_EMAIL;
                break;
            default:
                requestPermission = '';
                break;
        }
        return requestPermission;
    }
    /**
     * Checks if the provided token is authenticated
     * @param token
     * @return {Promise<admin.auth.DecodedIdToken>}
     */
    checkAuthentication(token) {
        return this.admin.verifyIdToken(token);
    }
    /**
     * Express.js style middleware function that can be used to authenticate
     * a request with Firebase
     * @param {Request} request The HTTP request object
     * In order to properly verify the request, this function reads the
     * request.headers['idtoken'] field. This should be set properly in the request
     * @param response
     * @param next
     */
    authenticationMiddleware(request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            // Allow all requests on local
            if (util_1.Util.getCurrentEnv() === util_1.Environment.DEBUG) {
                return next();
            }
            if (!request.headers.idtoken) {
                return util_1.Util.standardErrorHandler(new errors_1.HttpError('ID token must be provided', 401), next);
            }
            try {
                const decodedToken = yield this.checkAuthentication(request.headers.idtoken);
                response.locals.user = decodedToken;
                response.locals.privilege = decodedToken.privilege;
                next();
            }
            catch (e) {
                this.logger.info(e);
                return util_1.Util.standardErrorHandler(new errors_1.HttpError(e.message || e, 401), next);
            }
        });
    }
    /**
     * Verifies if the given user has the ability to access the requested operation
     * NOTE: This function requires that response.locals.user is set.
     * @param {IAclPerm} permission The operation permission for the object e.g. event:create
     * @param {AclOperations} requestedOp The requested operation to perform
     * @returns {(request: Request, response: e.Response, next: e.NextFunction) => void}
     */
    verifyAcl(permission, requestedOp) {
        return (request, response, next) => {
            /**
             * The user is an {@link AuthLevel.PARTICIPANT} which is the default AuthLevel
             */
            if (!response.locals.user) {
                response.locals.user = {};
            }
            if (!response.locals.user.privilege) {
                response.locals.user.privilege = auth_types_1.AuthLevel.PARTICIPANT;
            }
            try {
                if (this.verifyAclRaw(permission, requestedOp, response.locals.user, response.locals.customVerifierParams))
                    return next();
                return util_1.Util.standardErrorHandler(new errors_1.HttpError('Insufficient permissions for this operation', 401), next);
            }
            catch (error) {
                return util_1.Util.standardErrorHandler(error, next);
            }
        };
    }
    verifyAclRaw(permission, requestedOp, userToken, customVerifierParams) {
        if (util_1.Util.getCurrentEnv() === util_1.Environment.DEBUG) {
            return true;
        }
        if (Array.isArray(requestedOp)) {
            requestedOp.every((op) => {
                return this.verifyAclInternalOrThrow(op, permission, userToken, customVerifierParams);
            });
            return true;
        }
        this.verifyAclInternalOrThrow(requestedOp, permission, userToken, customVerifierParams);
        return true;
    }
    getUserId(identifier) {
        if (email_validator_1.validate(identifier)) {
            return this.admin.getUserByEmail(identifier);
        }
        return this.admin.getUser(identifier);
    }
    /**
     * Returns whether the ACL found is allowed to access the operation of the requested
     * level
     */
    aclVerifier(foundAcl, requestedOp, customParams) {
        if (Array.isArray(foundAcl)) {
            return foundAcl.some(acl => this.acl.can(auth_types_1.AuthLevel[acl], requestedOp, customParams));
        }
        return this.acl.can(auth_types_1.AuthLevel[foundAcl], requestedOp, customParams);
    }
    elevate(uid, privilege) {
        return this.admin.setCustomUserClaims(uid, { privilege, admin: true });
    }
    verifyAclInternalOrThrow(requestedOp, permission, userToken, customVerifierParams) {
        const requestPermission = FirebaseAuthService_1.extractedPermission(requestedOp, permission);
        if (!this.aclVerifier(userToken.privilege, requestPermission, customVerifierParams)) {
            this.logger.info(`Requested permission was: ${requestPermission}`);
            this.logger.info(userToken);
            throw new errors_1.HttpError('Insufficient permissions for this operation', 401);
        }
        return true;
    }
};
FirebaseAuthService = FirebaseAuthService_1 = __decorate([
    injection_js_1.Injectable(),
    __param(0, injection_js_1.Inject('FirebaseService')),
    __param(1, injection_js_1.Inject('IAcl')),
    __param(2, injection_js_1.Inject('BunyanLogger')),
    __metadata("design:paramtypes", [Object, Object, logging_1.Logger])
], FirebaseAuthService);
exports.FirebaseAuthService = FirebaseAuthService;
//
// /**
//  * Makes the provided UID an administrator with the provided privilege level
//  * @param uid
//  * @param privilege
//  * @return {Promise<void>}
//  */
//
// /**
//  * Retrieve the userID base on the email provided
//  *  @param email
//  *  @return Promise{firebase.auth.UserRecord}
//  */
// export function getUserId(email) {
//   return admin.auth().getUserByEmail(email);
// }
//
// /**
//  *
//  * @param uid
//  * @return {Promise<firebase.auth.UserRecord>}
//  */
// export function getUserData(uid) {
//   return admin.auth().getUser(uid);
// }
//# sourceMappingURL=firebase-auth.js.map