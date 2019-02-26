import { NextFunction, Request, Response } from 'express';
import { UidType } from '../../../JSCommon/common-types';
import { HttpError } from '../../../JSCommon/errors';
import { Environment, Util } from '../../../JSCommon/util';
import { IRegisterDataMapper, Registration } from '../../../models/register';
import { IScannerDataMapper } from '../../../models/scanner';
import {
  AuthLevel,
  IApikeyAuthService,
  IFirebaseAuthService,
} from '../../../services/auth/auth-types';
import { AclOperations, IAclPerm } from '../../../services/auth/RBAC/rbac-types';
import { ParentRouter } from '../../router-types';

abstract class ScannerController extends ParentRouter {
  protected constructor(
    protected readonly authService: IFirebaseAuthService,
    protected readonly scannerAuthService: IApikeyAuthService,
    protected readonly scannerAcl: IAclPerm,
    protected readonly scannerDataMapper: IScannerDataMapper,
    private readonly registerDataMapper: IRegisterDataMapper,
  ) {
    super();
  }

  protected async verifyScannerPermissionsMiddleware(
    request: Request,
    response: Response,
    next: NextFunction,
    operation: AclOperations | AclOperations[],
  ) {
    if (Util.getCurrentEnv() === Environment.DEBUG) {
      return next();
    }
    /**
     * The user is an {@link AuthLevel.PARTICIPANT} which is the default AuthLevel
     */
    try {
      if (request.headers.idtoken) {
        const decodedToken = await this.authService.checkAuthentication(request.headers.idtoken as string);
        if (!decodedToken.privilege) {
          decodedToken.privilege = AuthLevel.PARTICIPANT;
        }
        if (this.authService.verifyAclRaw(
          this.scannerAcl,
          operation,
          decodedToken,
        )) {
          return next();
        }
      }
      if (!request.headers.macaddr) {
        return Util.standardErrorHandler(
          new HttpError('could not find mac address of device', 400),
          next,
        );
      }
      if (await this.scannerAuthService.checkAuthentication(
        request.headers.apikey as string,
        request.headers.macaddr as string,
      )) {
        return next();
      }
    } catch (error) {
      return Util.standardErrorHandler(new HttpError(error.message || error, 401), next);
    }
    return Util.standardErrorHandler(new HttpError('Could not verify authentication', 401), next);
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
  protected async getUserByRfidBand(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    if (!req.body.wid && !req.query.wid) {
      // Cannot lookup user details by wristband ID
      return next();
    }
    try {
      const { data: rfidAssignment } = await this.scannerDataMapper.get(
        req.body.wid || req.query.wid,
        { byHackathon: true },
      );
      const [registration, userToken] = await Promise.all(
        [
          this.registerDataMapper.get(rfidAssignment.user_uid),
          this.authService.getUserId(rfidAssignment.user_uid),
        ],
      );
      res.locals.registsaration = registration.data as Registration;
      res.locals.userToken = userToken;
      return next();
    } catch (error) {
      return Util.standardErrorHandler(error, next);
    }
  }
}

export { ScannerController };
