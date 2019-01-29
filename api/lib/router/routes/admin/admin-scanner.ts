import { NextFunction, Request, Response, Router } from 'express';
import { Inject, Injectable } from 'injection-js';
import { IExpressController, ResponseBody } from '../..';
import { HttpError } from '../../../JSCommon/errors';
import { Util } from '../../../JSCommon/util';
import { IScannerDataMapper } from '../../../models/scanner';
import { RfidAssignment } from '../../../models/scanner/rfid-assignment';
import {
  AuthLevel,
  IApikeyAuthService,
  IFirebaseAuthService,
} from '../../../services/auth/auth-types';
import { AclOperations, IAclPerm } from '../../../services/auth/RBAC/rbac-types';
import { IDbResult } from '../../../services/database';
import { ParentRouter } from '../../router-types';

@Injectable()
export class AdminScannerController extends ParentRouter implements IExpressController {
  public router: Router;

  constructor(
    @Inject('IAuthService') private readonly authService: IFirebaseAuthService,
    @Inject('IScannerAuthService') private readonly scannerAuthService: IApikeyAuthService,
    @Inject('IScannerDataMapper') private readonly scannerDataMapper: IScannerDataMapper,
    @Inject('IScannerDataMapper') private readonly scannerAcl: IAclPerm,
  ) {
    super();
    this.router = Router();
    this.routes(this.router);
  }

  public routes(app: Router): void {
    app.post(
      '/assign',
      (req, res, next) => this.verifyScannerPermissionsMiddleware(req, res, next, AclOperations.CREATE),
      (req, res, next) => this.addRfidAssignments(req, res, next),
    );
    app.get(
      '/register',
      (req, res, next) => this.authService.authenticationMiddleware(req, res, next),
      this.authService.verifyAcl(this.scannerAcl, AclOperations.CREATE),
      (_req, res, next) => this.registerNewScannerHandler(res, next),
    );
    app.post(
      '/register',
      (req, res, next) => this.confirmRegisterScannerHandler(req, res, next),
    );
  }

  private async verifyScannerPermissionsMiddleware(
    request: Request,
    response: Response,
    next: NextFunction,
    operation: AclOperations | AclOperations[],
  ) {
    /**
     * The user is an {@link AuthLevel.PARTICIPANT} which is the default AuthLevel
     */
    try {
      if (response.locals.user) {
        if (!response.locals.user.privilege) {
          response.locals.user.privilege = AuthLevel.PARTICIPANT;
        }
        if (this.authService.verifyAclRaw(
          this.scannerAcl,
          operation,
          response.locals.user,
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

  private async registerNewScannerHandler(
    response: Response,
    next: NextFunction,
  ) {
    try {
      const pinToken = await this.scannerAuthService.generatePinAuthenticator();
      return this.sendResponse(
        response,
        new ResponseBody('Success', 200, { result: 'Success', data: pinToken }),
      );
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * @api {post} /admin/scanner/assign Assign RFID tags ID to users
   * @apiVersion 1.0.0
   * @apiName Assign an RFID to a user (Admin)
   *
   * @apiGroup Admin
   * @apiPermission TeamMemberPermission
   *
   * @apiUse AuthArgumentRequired
   * @apiParam {Array} assignments An array or single instance of RFID tags to User uid assignments
   * @apiParamExample {json} Request-Example:
   *     [
   *      {
   *       "rfid": "1vyv2boy1v3b4oi12-1234lhb1234b",
   *       "uid": "nbG7b87NB87nB7n98Y7",
   *       "time": 1239712938120
   *     },
   *     { ... }
   *     ]
   * @apiSuccess {String} Success
   * @apiUse IllegalArgumentError
   */
  private async addRfidAssignments(req: Request, res: Response, next: NextFunction) {
    // Validate incoming request
    if (!req.body) {
      return Util.standardErrorHandler(new HttpError('Illegal request format', 400), next);
    }
    if (!req.body.assignments) {
      return Util.standardErrorHandler(
        new HttpError('Cannot find assignment(s) to add', 400),
        next,
      );
    }

    try {
      let response: ResponseBody;
      if (Array.isArray(req.body.assignments)) {
        const assignments: RfidAssignment[] = req.body.assignments.map(
          assignment => new RfidAssignment(assignment));
        const result = await this.scannerDataMapper
          .addRfidAssignments(assignments);

        // Find response status to send
        const status = Math.max(
          ...result.data.map(
            (individualResult) => {
              switch (individualResult.result) {
                case 'Error':
                  return 500;
                case 'Duplicate detected':
                  return 409;
                case 'Bad input':
                  return 400;
                default:
                  return 200;
              }
            },
          ),
        );

        response = new ResponseBody(
          'Success',
          status,
          result,
        );
      } else {
        const assignment = new RfidAssignment(req.body.assignments);
        const result = await this.scannerDataMapper.insert(assignment);
        response = new ResponseBody(
          'Success',
          200,
          result as IDbResult<RfidAssignment>,
        );
      }
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.standardErrorHandler(error, next);
    }
  }

  private async confirmRegisterScannerHandler(
    request: Request,
    response: Response,
    next: NextFunction,
  ) {
    // Validate incoming request
    if (!request.body) {
      return Util.standardErrorHandler(new HttpError('Illegal request format', 400), next);
    }
    if (!request.body.pin || !parseInt(request.body.pin, 10)) {
      return Util.standardErrorHandler(
        new HttpError('could not find authentication pin', 400),
        next,
      );
    }
    if (!request.headers.macaddr) {
      return Util.standardErrorHandler(
        new HttpError('could not find mac address of device', 400),
        next,
      );
    }
    try {
      const result = await this.scannerAuthService
        .checkPinAuthentication(parseInt(request.body.pin, 10));
      if (!result) {
        return Util.standardErrorHandler(
          new HttpError('invalid authentication pin provided', 401),
          next,
        );
      }
      const apiToken = await this.scannerAuthService.generateApiKey(request.headers.macaddr as string);
      return this.sendResponse(
        response,
        new ResponseBody('Success', 200, { result: 'Success', data: apiToken }),
      );
    } catch (error) {
      return Util.errorHandler500(error, next);
    }

  }
}
