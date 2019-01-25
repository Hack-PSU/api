import { NextFunction, Response, Router } from 'express';
import { Inject } from 'injection-js';
import { IExpressController, ResponseBody } from '../..';
import { Util } from '../../../JSCommon/util';
import {
  IAdminStatisticsDataMapper,
  IUserCount,
  IUserStatistics,
} from '../../../models/admin/statistics';
import {
  IPreRegisterDataMapper,
  IRegisterDataMapper,
  IRegistrationStats,
} from '../../../models/register';
import { IAuthService } from '../../../services/auth/auth-types';
import { AclOperations, IAclPerm } from '../../../services/auth/RBAC/rbac-types';
import { IDbResult } from '../../../services/database';
import { Logger } from '../../../services/logging/logging';
import { ParentRouter } from '../../router-types';

export class AdminStatisticsController extends ParentRouter implements IExpressController {
  public router: Router;

  constructor(
    @Inject('IAuthService') private readonly authService: IAuthService,
    @Inject('IAdminStatisticsDataMapper') private readonly adminStatisticsDataMapper: IAdminStatisticsDataMapper,
    @Inject('IAdminStatisticsDataMapper') private readonly acl: IAclPerm,
    @Inject('IRegisterDataMapper') private readonly registerDataMapper: IRegisterDataMapper,
    @Inject('IPreRegisterDataMapper') private readonly preRegDataMapper: IPreRegisterDataMapper,
    @Inject('BunyanLogger') private readonly logger: Logger,
  ) {
    super();
    this.router = Router();
    this.routes(this.router);
  }

  public routes(app: Router): void {
    app.use(this.authService.verifyAcl(this.acl, AclOperations.STATISTICS));
    app.get(
      '/',
      (req, res, next) => this.getStatisticsHandler(res,  next),
    );
    app.get(
      '/count',
      (req, res, next) => this.getStatisticsCountHandler(res, next),
    );
    app.get(
      '/user',
      (req, res, next) => this.getUserCountHandler(res, next),
    );
    app.get(
      '/preregistration',
      (req, res, next) => this.getPreRegistrationCountHandler(res, next),
    );
  }

  /**
   * @api {get} /admin/statistics Get all user data
   * @apiVersion 1.0.0
   * @apiName Get list of all users
   * @apiGroup Admin Statistics
   * @apiPermission TeamMemberPermission
   *
   * @apiParam {Number} limit=Math.inf Limit to a certain number of responses
   * @apiParam {Number} offset=0 The offset to start retrieving users from. Useful for pagination
   *
   * @apiUse AuthArgumentRequired
   *
   * @apiSuccess {Array} Array of all users
   */
  private async getStatisticsHandler(res: Response, next: NextFunction) {
    let result: IDbResult<IUserStatistics>;
    try {
      result = await this.adminStatisticsDataMapper.getAllUserData({
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
   * @api {get} /admin/statistics/count Get the count of category statistics
   * @apiVersion 1.0.0
   * @apiName Get Registration Statistics Count
   * @apiGroup Admin Statistics
   * @apiPermission TeamMemberPermission
   *
   * @apiUse AuthArgumentRequired
   *
   * @apiSuccess {Array} number of users that selected particular categories for registrations
   */
  private async getStatisticsCountHandler(
    res: Response,
    next: NextFunction,
  ) {
    let result: IDbResult<IRegistrationStats>;
    try {
      result = await this.registerDataMapper.getStats({
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
   * @api {get} /admin/statistics/user Get the count of users in each category
   * @apiVersion 1.0.0
   * @apiName Get User Count
   * @apiGroup Admin Statistics
   * @apiPermission TeamMemberPermission
   *
   * @apiUse AuthArgumentRequired
   *
   * @apiSuccess {Array} number of all users in each category (PreRegistration, Registration, RSVP, Scans)
   */
  private async getUserCountHandler(
    res: Response,
    next: NextFunction,
  ) {
    let result: IDbResult<IUserCount>;
    try {
      result = await this.adminStatisticsDataMapper.getUserCount({
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
   * @api {get} /admin/statistics/preregistration Get a count of Preregistered Users
   * @apiVersion 1.0.0
   * @apiName get count preregistration
   * @apiGroup Admin Statistics
   * @apiPermission TeamMemberPermission
   *
   * @apiUse AuthArgumentRequired
   *
   * @apiSuccess {Array} number of preregistered users
   */
  private async getPreRegistrationCountHandler(res: Response, next: NextFunction) {
    let result: IDbResult<number>;
    try {
      result = await this.preRegDataMapper.getCount({
        byHackathon: !res.locals.allHackathons,
        hackathon: res.locals.hackathon,
      });
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
    const response = new ResponseBody('Success', 200, result);
    return this.sendResponse(res, response);
  }
}
