import { validate } from 'email-validator';
import { NextFunction, Request, Response, Router } from 'express';
import { Inject, Injectable } from 'injection-js';
import { IExpressController, ResponseBody } from '../..';
import { HttpError } from '../../../JSCommon/errors';
import { Util } from '../../../JSCommon/util';
import { IRegisterDataMapper, Registration } from '../../../models/register';
import { IAuthService } from '../../../services/auth/auth-types';
import { AclOperations, IAclPerm } from '../../../services/auth/RBAC/rbac-types';
import { Logger } from '../../../services/logging/logging';
import { ParentRouter } from '../../router-types';

@Injectable()
export class AdminRegisterController extends ParentRouter implements IExpressController {
  public router: Router;

  constructor(
    @Inject('IAuthService') private readonly authService: IAuthService,
    @Inject('IRegisterDataMapper') private readonly registerDataMapper: IRegisterDataMapper,
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
      this.authService.verifyAcl(this.acl, AclOperations.READ_ALL),
      (req, res, next) => this.getAllRegistrationHandler(res, next),
    );
    app.post(
      '/update',
      this.authService.verifyAcl(this.acl, AclOperations.COUNT),
      (req, res, next) => this.updateRegistrationHandler(req, res, next),
    );
    app.get(
      '/count',
      this.authService.verifyAcl(this.acl, AclOperations.COUNT),
      (req, res, next) => this.countRegistrationHandler(res, next),
    );
  }

  private validateRegistrationFields(registration: any) {
    if (!registration) {
      this.logger.error('No registration provided');
      throw new HttpError('No registration provided', 400);
    }
    if (!validate(registration.email)) {
      this.logger.error('IEmail used for registration is invalid');
      throw new HttpError('IEmail used for registration is invalid', 400);
    }
    if (!registration.eighteenBeforeEvent) {
      this.logger.error('User must be over eighteen years of age to register');
      throw new HttpError('User must be over eighteen years of age to register', 400);
    }
    if (!registration.mlhcoc) {
      this.logger.error('User must agree to MLH Code of Conduct');
      throw new HttpError('User must agree to MLH Code of Conduct', 400);
    }
    if (!registration.mlhdcp) {
      this.logger.error('User must agree to MLH data collection policy');
      throw new HttpError('User must agree to MLH data collection policy', 400);
    }
  }

  /**
   * @api {get} /admin/register Get registered hackers
   * @apiVersion 1.0.0
   * @apiName Get Registered Hackers
   * @apiGroup Registration
   * @apiPermission TeamMemberPermission
   *
   * @apiParam {Number} limit=Math.inf Limit to a certain number of responses
   * @apiParam {Number} offset=0 The offset to start retrieving users from. Useful for pagination
   * @apiParam {string} hackathon The hackathon uid to get registration details for
   * @apiParam {boolean} allHackathons Whether to retrieve data for all hackathons
   *
   * @apiUse AuthArgumentRequired
   *
   * @apiSuccess {Array} Array of registered hackers
   */
  private async getAllRegistrationHandler(res: Response, next: NextFunction) {
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
   * @apiVersion 1.0.0
   * @apiName get count of registration
   * @apiGroup Registration
   * @apiPermission TeamMemberPermission
   * @apiParam {string} hackathon The hackathon uid to get registration details for
   * @apiParam {boolean} allHackathons Whether to retrieve data for all hackathons
   * @apiUse AuthArgumentRequired
   *
   * @apiSuccess {Array} number of registered users
   */
  private async countRegistrationHandler(res: Response, next: NextFunction) {
    let result;
    try {
      result = await this.registerDataMapper.getCount({
        byHackathon: !res.locals.allHackathons,
        hackathon: res.locals.hackathon,
      });
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
    const response = new ResponseBody('Success', 200, result);
    return this.sendResponse(res, response);
  }

  /**
   * @api {post} /admin/register/update Update an existing registration
   * @apiVersion 1.0.0
   * @apiName Update Registration
   * @apiGroup Registration
   * @apiPermission DirectorPermission
   * @apiParam {Object} registration The updated registration object.
   * @apiUse AuthArgumentRequired
   */
  private async updateRegistrationHandler(req: Request, res: Response, next: NextFunction) {
    // Validate incoming registration
    if (!req.body || !req.body.registration) {
      return Util.standardErrorHandler(
        new HttpError('Registration field missing', 400),
        next,
      );
    }
    try {
      this.registerDataMapper.normaliseRegistrationData(req.body.registration);
      req.body.registration.uid = res.locals.user.uid;
      req.body.registrationemail = res.locals.user.email;
      this.validateRegistrationFields(req.body.registration);
    } catch (error) {
      return Util.standardErrorHandler(
        new HttpError(error.toString(), 400),
        next,
      );
    }

    let registration: Registration;
    try {
      registration = new Registration(req.body.registration);
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
        { result: 'Success', data: { registration, result } },
      );
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }
}
