import { validate } from 'email-validator';
import { NextFunction, Request, Response, Router } from 'express';
import { Inject, Injectable } from 'injection-js';
import { IExpressController, ResponseBody } from '../..';
import { UidType } from '../../../JSCommon/common-types';
import { HttpError } from '../../../JSCommon/errors';
import { Util } from '../../../JSCommon/util';
import { IActiveHackathonDataMapper } from '../../../models/hackathon/active-hackathon';
import { IRegisterDataMapper } from '../../../models/register';
import { Registration } from '../../../models/register/registration';
import { IRegistrationProcessor } from '../../../processors/registration-processor';
import { IFirebaseAuthService } from '../../../services/auth/auth-types';
import { AclOperations, IAclPerm } from '../../../services/auth/RBAC/rbac-types';
import { Logger } from '../../../services/logging/logging';
import { ParentRouter } from '../../router-types';

@Injectable()
export class AdminRegisterController extends ParentRouter implements IExpressController {
  public router: Router;

  constructor(
    @Inject('IAuthService') private readonly authService: IFirebaseAuthService,
    @Inject('IRegisterDataMapper') private readonly registerDataMapper: IRegisterDataMapper,
    @Inject('IActiveHackathonDataMapper') private readonly activeHackathonDataMapper: IActiveHackathonDataMapper,
    @Inject('IRegistrationProcessor') private readonly registrationProcessor: IRegistrationProcessor,
    @Inject('IRegisterDataMapper') private readonly acl: IAclPerm,
    @Inject('BunyanLogger') private readonly logger: Logger,
  ) {
    super();
    this.router = Router();
    this.routes(this.router);
  }

  public routes(app: Router): void {
    app.get(
      '/',
      this.authService.verifyAcl(this.acl, [AclOperations.READ_ALL, AclOperations.READ]),
      (req, res, next) => this.getAllRegistrationHandler(req, res, next),
    );
    app.post(
      '/update',
      this.authService.verifyAcl(this.acl, AclOperations.UPDATE),
      (req, res, next) => this.updateRegistrationHandler(req, res, next),
    );
    app.get(
      '/count',
      this.authService.verifyAcl(this.acl, AclOperations.COUNT),
      (req, res, next) => this.countRegistrationHandler(res, next),
    );
  }

  /**
   * @api {get} /admin/register Get registered hackers
   * @apiVersion 2.0.0
   * @apiName Get Registered Hackers
   * @apiGroup Admin Registration
   * @apiPermission TeamMemberPermission
   *
   * @apiParam {Number} limit=Math.inf Limit to a certain number of responses
   * @apiParam {Number} offset=0 The offset to start retrieving users from. Useful for pagination
   * @apiParam {String} hackathon The hackathon uid to get registration details for
   * @apiParam {Boolean} allHackathons Whether to retrieve data for all hackathons
   * @apiParam {String} [uid] Uid of the hacker
   * @apiParam {String} [email] Email of the hacker
   * @apiUse AuthArgumentRequired
   *
   * @apiSuccess {Registration[]} data Array of registered hackers
   * @apiUse ResponseBodyDescription
   */
  private async getAllRegistrationHandler(req: Request, res: Response, next: NextFunction) {
    if (req.query.email || req.query.uid) {
      return this.getRegistrationHandler(req, res, next);
    }
    let result;
    try {
      result = await this.registerDataMapper.getAll({
        byHackathon: !res.locals.allHackathons,
        count: res.locals.limit,
        hackathon: res.locals.hackathon,
        startAt: res.locals.offset,
      });
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
    const response = new ResponseBody('Success', 200, result);
    return this.sendResponse(res, response);
  }

  /**
   * @api {get} /admin/register/count Get a count of Registered Users
   * @apiVersion 2.0.0
   * @apiName get count of registration
   * @apiGroup Admin Registration
   * @apiPermission TeamMemberPermission
   * @apiUse AuthArgumentRequired
   *
   * @apiSuccess {Number} count Number of registered users
   * @apiUse ResponseBodyDescription
   * @apiUse RequestOptsCount
   */
  private async countRegistrationHandler(res: Response, next: NextFunction) {
    let result;
    try {
      result = await this.registerDataMapper.getCount({
        byHackathon: !res.locals.allHackathons,
        hackathon: res.locals.hackathon,
        ignoreCache: res.locals.ignoreCache,
      });
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
    const response = new ResponseBody('Success', 200, result);
    return this.sendResponse(res, response);
  }

  /**
   * @api {post} /admin/register/update Update an existing registration
   * @apiVersion 2.0.0
   * @apiName Update Registration
   * @apiGroup Admin Registration
   * @apiPermission UserPermission
   * @apiParam {Registration} registration The updated registration object.
   * @apiUse AuthArgumentRequired
   * @apiUse ResponseBodyDescription
   */
  private async updateRegistrationHandler(req: Request, res: Response, next: NextFunction) {
    // Validate incoming registration
    if (!req.body || !req.body.registration) {
      return Util.standardErrorHandler(
        new HttpError('registration field missing', 400),
        next,
      );
    }
    if (!req.body.registration.uid) {
      return Util.standardErrorHandler(
        new HttpError('registration id missing', 400),
        next,
      );
    }
    if (!req.body.registration.hackathon) {
      return Util.standardErrorHandler(
        new HttpError('hackathon id missing', 400),
        next,
      );
    }
    try {
      await this.registrationProcessor.normaliseRegistrationData(req.body.registration);
    } catch (error) {
      return Util.standardErrorHandler(
        new HttpError(error.toString(), 400),
        next,
      );
    }

    let registration: Registration;
    try {
      registration = new Registration(req.body.registration);
      registration.hackathon = req.body.registration.hackathon;
    } catch (error) {
      return Util.standardErrorHandler(
        new HttpError('Some properties were not as expected', 400),
        next,
      );
    }
    try {
      const result = await this.registerDataMapper.update(registration);
      const response = new ResponseBody(
        'Success',
        200,
        result,
      );
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  private async getRegistrationHandler(req: Request, res: Response, next: NextFunction) {
    if (!req.query.hackathon) {
      const hackathon = await this.activeHackathonDataMapper.activeHackathon.toPromise();
      req.query.hackathon = hackathon.uid;
    }
    let uid: UidType;
    if (req.query.email) {
      ({ uid } = await this.authService.getUserById(req.query.email));
    } else {
      uid = req.query.uid;
    }

    try {
      const result = await this.registerDataMapper.get({ uid, hackathon: req.query.hackathon });
      const response = new ResponseBody('Success', 200, result);
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }
}
