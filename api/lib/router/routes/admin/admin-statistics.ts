import { NextFunction, Request, Response, Router } from 'express';
import { Inject, Injectable } from 'injection-js';
import { IExpressController, ResponseBody } from '../..';
import { HttpError } from '../../../JSCommon/errors';
import { Util } from '../../../JSCommon/util';
import {
  IAdminStatisticsDataMapper,
  IUserCount,
  IUserStatistics,
} from '../../../models/admin/statistics';
import { IAttendanceDataMapper } from '../../../models/attendance/attendance-data-mapper-impl';
import { IExtraCreditDataMapper } from '../../../models/extra-credit';
import {
  IPreRegisterDataMapper,
  IRegisterDataMapper,
  IRegistrationStats,
} from '../../../models/register';
import { Rsvp } from '../../../models/RSVP/rsvp';
import { IFirebaseAuthService } from '../../../services/auth/auth-types';
import { AclOperations, IAclPerm } from '../../../services/auth/RBAC/rbac-types';
import { IDataMapper, IDbResult } from '../../../services/database';
import { Logger } from '../../../services/logging/logging';
import { ParentRouter } from '../../router-types';

@Injectable()
export class AdminStatisticsController extends ParentRouter implements IExpressController {
  public router: Router;

  constructor(
    @Inject('IAuthService') private readonly authService: IFirebaseAuthService,
    @Inject('IAdminStatisticsDataMapper') private readonly adminStatisticsDataMapper: IAdminStatisticsDataMapper,
    @Inject('IExtraCreditDataMapper') private readonly extraCreditDataMapper: IExtraCreditDataMapper,
    @Inject('IRsvpDataMapper') private readonly rsvpDataMapper: IDataMapper<Rsvp>,
    @Inject('IAdminStatisticsDataMapper') private readonly acl: IAclPerm,
    @Inject('IAttendanceDataMapper') private readonly attendanceDataMapper: IAttendanceDataMapper,
    @Inject('IRegisterDataMapper') private readonly registerDataMapper: IRegisterDataMapper,
    @Inject('IPreRegisterDataMapper') private readonly preRegDataMapper: IPreRegisterDataMapper,
    @Inject('BunyanLogger') private readonly logger: Logger,
  ) {
    super();
    this.router = Router();
    this.routes(this.router);
  }

  public routes(app: Router): void {
    app.use(this.authService.verifyAcl(this.acl, AclOperations.READ));
    app.get(
      '/',
      (req, res, next) => this.getStatistics(req, res, next),
    );
  }

  /**
   * @api {get} /admin/data/?type=registration_stats Get all user data
   * @apiVersion 2.0.0
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
   * @apiUse ResponseBodyDescription
   */
  private async getRegistrationStatisticsHandler(res: Response, next: NextFunction) {
    let result: IDbResult<IUserStatistics[]>;
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
   * @api {get} /admin/data/?type=registration_category_count Get the count of category data
   * @apiVersion 2.0.0
   * @apiName Get Registration Statistics Count
   * @apiGroup Admin Statistics
   * @apiPermission TeamMemberPermission
   *
   * @apiUse AuthArgumentRequired
   *
   * @apiSuccess {Array} number of users that selected particular categories for registrations
   * @apiUse ResponseBodyDescription
   */
  private async getRegistrationStatisticsCountHandler(
    res: Response,
    next: NextFunction,
  ) {
    let result: IDbResult<IRegistrationStats[]>;
    try {
      result = await this.registerDataMapper.getRegistrationStats({
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
   * @api {get} /admin/data/?type=stats_count Get number of users by interaction type (Pre registration, Registration, RSVP, Event scans)
   * @apiVersion 2.0.0
   * @apiName Get User Count
   * @apiGroup Admin Statistics
   * @apiPermission TeamMemberPermission
   *
   * @apiUse AuthArgumentRequired
   *
   * @apiSuccess {ResponseBody} number of all users in each category (PreRegistration, Registration, RSVP, Scans)
   * @apiUse ResponseBodyDescription
   */
  private async getUserCountByCategoryHandler(
    res: Response,
    next: NextFunction,
  ) {
    let result: IDbResult<IUserCount[]>;
    try {
      result = await this.adminStatisticsDataMapper.getUserCountByCategory({
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
   * @api {get} /admin/data/?type=preregistration_count Get a count of Preregistered Users
   * @apiVersion 2.0.0
   * @apiName get count preregistration
   * @apiGroup Admin Statistics
   * @apiPermission TeamMemberPermission
   *
   * @apiUse AuthArgumentRequired
   *
   * @apiSuccess {ResponseBody} number of preregistered users
   * * @apiUse ResponseBodyDescription
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

  /**
   * @api {get} /admin/data/?type=preregistration Get all pre-registered users
   * @apiVersion 2.0.0
   * @apiName Get Pre-registration
   * @apiGroup Admin Statistics
   * @apiPermission TeamMemberPermission
   *
   * @apiUse AuthArgumentRequired
   *
   * @apiSuccess {Array} all preregistered users
   */
  private async getPreRegistrationHandler(res: Response, next: NextFunction) {
    try {
      const result = await this.preRegDataMapper.getAll({
        byHackathon: !res.locals.allHackathons,
        count: res.locals.limit,
        hackathon: res.locals.hackathon,
        startAt: res.locals.offset,
      });
      const response = new ResponseBody('Success', 200, result);
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * @api {get} /admin/data/?type=rsvp Get all RSVP'ed users
   * @apiVersion 2.0.0
   * @apiName Get RSVP
   * @apiGroup Admin Statistics
   * @apiPermission TeamMemberPermission
   *
   * @apiUse AuthArgumentRequired
   *
   * @apiSuccess {Array} All RSVP'ed users
   */
  private async getRsvpHandler(res: Response, next: NextFunction) {
    try {
      const result = await this.rsvpDataMapper.getAll({
        byHackathon: !res.locals.allHackathons,
        count: res.locals.limit,
        hackathon: res.locals.hackathon,
        startAt: res.locals.offset,
      });
      const response = new ResponseBody('Success', 200, result);
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * @api {get} /admin/data/?type=rsvp_count Get number of RSVP'ed users
   * @apiVersion 2.0.0
   * @apiName Get RSVP Count
   * @apiGroup Admin Statistics
   * @apiPermission TeamMemberPermission
   *
   * @apiUse AuthArgumentRequired
   *
   * @apiSuccess {Array} All RSVP'ed users
   */
  private async getRsvpCountHandler(res: Response, next: NextFunction) {
    try {
      const result = await this.rsvpDataMapper.getCount({
        byHackathon: !res.locals.allHackathons,
        count: res.locals.limit,
        hackathon: res.locals.hackathon,
        startAt: res.locals.offset,
      });
      const response = new ResponseBody('Success', 200, result);
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * @api {get} /admin/data/?type=attendance Get all attendance data
   * @apiVersion 2.0.0
   * @apiName Get Attendance
   * @apiGroup Admin Statistics
   * @apiPermission TeamMemberPermission
   *
   * @apiUse AuthArgumentRequired
   *
   * @apiSuccess {Array} All Attendance data
   *
   */
  private async getAttendanceHandler(res: Response, next: NextFunction) {
    try {
      const result = await this.attendanceDataMapper.getAll({
        byHackathon: !res.locals.allHackathons,
        count: res.locals.limit,
        hackathon: res.locals.hackathon,
        startAt: res.locals.offset,
      });
      const response = new ResponseBody('Success', 200, result);
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * @api {get} /admin/data/?type=attendance&aggregator=event Get all attendance data by event
   * @apiVersion 2.0.0
   * @apiName Get Attendance by event
   * @apiGroup Admin Statistics
   * @apiPermission TeamMemberPermission
   * @apiParam [event] {String} The uid of an event to filter by
   * @apiUse AuthArgumentRequired
   *
   * @apiSuccess {ResponseBody} All Attendance data aggregated by event
   * @apiUse ResponseBodyDescription
   */
  private async getAttendanceByEventHandler(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.attendanceDataMapper.getAttendanceByEvent({
        byHackathon: !res.locals.allHackathons,
        count: res.locals.limit,
        hackathon: res.locals.hackathon,
        startAt: res.locals.offset,
        event: req.query.event,
      });
      const response = new ResponseBody('Success', 200, result);
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * @api {get} /admin/data/?type=extra_credit_classes Get all extra credit classes
   * @apiVersion 2.0.0
   * @apiName Get Extra Credit Classes
   * @apiGroup Admin Statistics
   * @apiPermission TeamMemberPermission
   *
   * @apiUse AuthArgumentRequired
   *
   * @apiSuccess {Array} All Attendance data
   */
  private async getExtraCreditClassesHandler(res: Response, next: NextFunction) {
    try {
      const result = await this.extraCreditDataMapper.getAllClasses({
        byHackathon: !res.locals.allHackathons,
        count: res.locals.limit,
        hackathon: res.locals.hackathon,
        startAt: res.locals.offset,
      });
      const response = new ResponseBody('Success', 200, result);
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * Handler that parses query type and routes to the appropriate handler
   */
  private getStatistics(req: Request, res: Response, next: NextFunction) {
    if (!req.query.type) {
      return Util.standardErrorHandler(
        new HttpError(
          'Type of required statistic must be provided in query',
          400,
        ),
        next,
      );
    }

    switch (req.query.type) {
      case 'stats_count':
        return this.getUserCountByCategoryHandler(res, next);
      case 'preregistration_count':
        return this.getPreRegistrationCountHandler(res, next);
      case 'preregistration':
        return this.getPreRegistrationHandler(res, next);
      case 'registration_category_count':
        return this.getRegistrationStatisticsCountHandler(res, next);
      case 'registration_stats':
        return this.getRegistrationStatisticsHandler(res, next);
      case 'rsvp':
        return this.getRsvpHandler(res, next);
      case 'rsvp_count':
        return this.getRsvpCountHandler(res, next);
      case 'attendance':
        switch (req.query.aggregator) {
          case 'event':
            return this.getAttendanceByEventHandler(req, res, next);
          default:
            return this.getAttendanceHandler(res, next);
        }
      case 'extra_credit_classes':
        return this.getExtraCreditClassesHandler(res, next);
      default:
        return Util.standardErrorHandler(
          new HttpError(
            'provided statistics type is not supported',
            400,
          ),
          next,
        );
    }
  }
}
