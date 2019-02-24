"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("../../../JSCommon/errors");
const util_1 = require("../../../JSCommon/util");
const auth_types_1 = require("../../../services/auth/auth-types");
const router_types_1 = require("../../router-types");
class ScannerController extends router_types_1.ParentRouter {
    constructor(authService, scannerAuthService, scannerAcl, scannerDataMapper, registerDataMapper, activeHackathonDataMapper) {
        super();
        this.authService = authService;
        this.scannerAuthService = scannerAuthService;
        this.scannerAcl = scannerAcl;
        this.scannerDataMapper = scannerDataMapper;
        this.registerDataMapper = registerDataMapper;
        this.activeHackathonDataMapper = activeHackathonDataMapper;
    }
    verifyScannerPermissionsMiddleware(request, response, next, operation) {
        return __awaiter(this, void 0, void 0, function* () {
            if (util_1.Util.getCurrentEnv() === util_1.Environment.DEBUG) {
                return next();
            }
            /**
             * The user is an {@link AuthLevel.PARTICIPANT} which is the default AuthLevel
             */
            try {
                if (request.headers.idtoken) {
                    const decodedToken = yield this.authService.checkAuthentication(request.headers.idtoken);
                    if (!decodedToken.privilege) {
                        decodedToken.privilege = auth_types_1.AuthLevel.PARTICIPANT;
                    }
                    if (this.authService.verifyAclRaw(this.scannerAcl, operation, decodedToken)) {
                        return next();
                    }
                }
                if (!request.headers.macaddr) {
                    return util_1.Util.standardErrorHandler(new errors_1.HttpError('could not find mac address of device', 400), next);
                }
                if (yield this.scannerAuthService.checkAuthentication(request.headers.apikey, request.headers.macaddr)) {
                    return next();
                }
            }
            catch (error) {
                return util_1.Util.standardErrorHandler(new errors_1.HttpError(error.message || error, 401), next);
            }
            return util_1.Util.standardErrorHandler(new errors_1.HttpError('Could not verify authentication', 401), next);
        });
    }
    /**
     * @apiDefine WristbandIdParam
     * @apiParam {String} wid The wristband ID to look up user by
     */
    /**
     * This middleware capable function looks up a user's login and registration details
     * based on an assigned wid from a valid wristband. The user's registration and authentication
     * information will be forwarded under res.locals.registration and res.locals.userToken
     * respectively
     * @param {e.Request} req Standard Express request
     * @param {e.Response} res Standard Express response
     * @param {e.NextFunction} next Standard Express nextFunction
     * @param {UidType} wid Wristband ID to lookup user by
     * @returns {Promise<void>}
     */
    getUserByRfidBand(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!req.body.wid) {
                // Cannot lookup user details by wristband ID
                return next();
            }
            try {
                const { data: rfidAssignment } = yield this.scannerDataMapper.get(req.body.wid, { byHackathon: true });
                const [registration, userToken] = yield Promise.all([
                    this.registerDataMapper.get({
                        uid: rfidAssignment.user_uid,
                        hackathon: (yield this.activeHackathonDataMapper.activeHackathon.toPromise()).id,
                    }),
                    this.authService.getUserId(rfidAssignment.user_uid),
                ]);
                res.locals.registration = registration.data;
                res.locals.userToken = userToken;
                next();
            }
            catch (error) {
                return util_1.Util.standardErrorHandler(error, next);
            }
        });
    }
}
exports.ScannerController = ScannerController;
//# sourceMappingURL=scanner-controller-abstract.js.map