import { NextFunction, Request, Response, Router } from 'express';
import { Inject, Injectable } from 'injection-js';
import { IExpressController, ResponseBody } from '../..';
import { HttpError } from '../../../JSCommon/errors';
import { Util } from '../../../JSCommon/util';
import { IAdminStatisticsDataMapper, IUserStatistics } from '../../../models/admin/statistics';
import { IRegisterDataMapper } from '../../../models/register';
import { IScannerDataMapper } from '../../../models/scanner';
import { RfidAssignment } from '../../../models/scanner/rfid-assignment';
import { IApikeyAuthService, IFirebaseAuthService } from '../../../services/auth/auth-types';
import { AclOperations, IAclPerm } from '../../../services/auth/RBAC/rbac-types';
import { IDbResult } from '../../../services/database';
import { ScannerController } from './scanner-controller-abstract';

@Injectable()
export class AdminScannerController extends ScannerController implements IExpressController {
  public router: Router;

  constructor(
    @Inject('IAdminStatisticsDataMapper') private readonly adminStatisticsDataMapper: IAdminStatisticsDataMapper,
    @Inject('IAuthService') authService: IFirebaseAuthService,
    @Inject('IScannerAuthService') scannerAuthService: IApikeyAuthService,
    @Inject('IScannerDataMapper') scannerAcl: IAclPerm,
    @Inject('IScannerDataMapper') scannerDataMapper: IScannerDataMapper,
    @Inject('IRegisterDataMapper') registerDataMapper: IRegisterDataMapper,
  ) {
    super(authService, scannerAuthService, scannerAcl, scannerDataMapper, registerDataMapper);
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
    app.get(
      '/registrations',
      (req, res, next) => this.verifyScannerPermissionsMiddleware(req, res, next, AclOperations.READ_ALL),
      (req, res, next) => this.getAllRegistrationsHandler(res, next),
    );
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

  /**
   * @api {get} /admin/scanner/registrations Obtain all registrations
   * @apiVersion 2.0.0
   * @apiName Obtain all registrations (Scanner)
   *
   * @apiGroup Admin
   * @apiPermission TeamMemberPermission
   *
   * @apiUse AuthArgumentRequired
   * @apiSuccess {Array} Registrations
   * @apiUse IllegalArgumentError
   */
  private async getAllRegistrationsHandler(res: Response, next: NextFunction) {
    let result: IDbResult<IUserStatistics[]>;
    try {
      result = await this.adminStatisticsDataMapper.getAllUserData({
        byHackathon: true,
      });
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
    const response = new ResponseBody('Success', 200, result);
    return this.sendResponse(res, response);
  }
}
