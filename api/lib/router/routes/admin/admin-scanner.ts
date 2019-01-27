import { NextFunction, Request, Response, Router } from 'express';
import { Inject, Injectable } from 'injection-js';
import { IExpressController, ResponseBody } from '../..';
import { HttpError } from '../../../JSCommon/errors';
import { Util } from '../../../JSCommon/util';
import { IScannerDataMapper } from '../../../models/scanner';
import { RfidAssignment } from '../../../models/scanner/rfid-assignment';
import { AuthLevel, IAuthService } from '../../../services/auth/auth-types';
import { AclOperations, IAclPerm } from '../../../services/auth/RBAC/rbac-types';
import { IDbResult } from '../../../services/database';
import { ParentRouter } from '../../router-types';

@Injectable()
export class AdminScannerController extends ParentRouter implements IExpressController {
  public router: Router;

  constructor(
    @Inject('IAuthService') private readonly authService: IAuthService,
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
    if (!response.locals.user.privilege) {
      response.locals.user.privilege = AuthLevel.PARTICIPANT;
    }
    return this.authService.verifyAclRaw(
      this.scannerAcl,
      operation,
      response.locals.user,
    ) || this.authService.verifyApiKey(request.headers.apikey as string);
  }

  /**
   * @api {post} /admin/assignment Assign RFID tags ID to users
   * @apiVersion 1.0.0
   * @apiName Assign an RFID to a user (Admin)
   *
   * @apiGroup Admin
   * @apiPermission TeamMemberPermission
   *
   * @apiUse AuthArgumentRequired
   * @apiParam {Array | Assignment} assignments An array or single instance of RFID tags to User uid assignments
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

    let result: IDbResult<RfidAssignment> | Array<IDbResult<RfidAssignment>>;
    try {
      let status = 200;
      let response: ResponseBody;
      if (Array.isArray(req.body.assignments)) {
        result = await this.scannerDataMapper.addRfidAssignments(req.body.assignments);
        // If any insertions fail, mark the response with 207 partial result status
        if (result.filter(assignment => assignment instanceof HttpError).length === 0) {
          status = 207;
        }

        // Replace error responses with the error and the original scan for the
        // caller to handle gracefully
        const handledResult = result.map((assignment, index) => {
          if (assignment instanceof HttpError) {
            return { scan: req.body.assignments[index], error: assignment as HttpError };
          }
          return assignment;
        });
        response = new ResponseBody(
          'Success',
          status,
          { result: 'Success', data: handledResult },
        );
      } else {
        result = await this.scannerDataMapper.insert(req.body.assignments);
        response = new ResponseBody(
          'Success',
          200,
          result as IDbResult<RfidAssignment>,
        );
      }
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }
}
