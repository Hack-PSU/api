import { NextFunction, Request, Response, Router } from 'express';
import { Inject, Injectable } from 'injection-js';
import { Hackathon } from 'models/hackathon';
import { Registration } from 'models/register/registration';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import { MysqlUow } from 'services/database/svc/mysql-uow.service';
import squel from 'squel';
import { IExpressController, ResponseBody } from '../..';
import { HttpError } from '../../../JSCommon/errors';
import { Util } from '../../../JSCommon/util';
import { IAdminStatisticsDataMapper, IUserStatistics } from '../../../models/admin/statistics';
import { IActiveHackathonDataMapper } from '../../../models/hackathon/active-hackathon';
import { IRegisterDataMapper } from '../../../models/register';
import { IScannerDataMapper } from '../../../models/scanner';
import { IScannerProcessor } from '../../../processors/scanner-processor';
import { IApikeyAuthService, IFirebaseAuthService } from '../../../services/auth/auth-types';
import { AclOperations, IAclPerm } from '../../../services/auth/RBAC/rbac-types';
import { IDbResult } from '../../../services/database';
import { AbstractScannerController } from './scanner-controller-abstract';


@Injectable()
export class ScannerController extends AbstractScannerController implements IExpressController {
  public router: Router;
  public tableName: string = 'WORKSHOP_SCANS';
  constructor(
    @Inject('IAdminStatisticsDataMapper') private readonly adminStatisticsDataMapper: IAdminStatisticsDataMapper,
    @Inject('IAdminScannerProcessor') private readonly scannerProcessor: IScannerProcessor,
    @Inject('IActiveHackathonDataMapper') activeHackathonDataMapper: IActiveHackathonDataMapper,
    @Inject('IAuthService') authService: IFirebaseAuthService,
    @Inject('IScannerAuthService') scannerAuthService: IApikeyAuthService,
    @Inject('IScannerDataMapper') scannerAcl: IAclPerm,
    @Inject('IScannerDataMapper') scannerDataMapper: IScannerDataMapper,
    @Inject('IRegisterDataMapper') registerDataMapper: IRegisterDataMapper,
    @Inject('MysqlUow') protected readonly sql: MysqlUow,
  ) {
    super(
      authService,
      scannerAuthService,
      scannerAcl,
      scannerDataMapper,
      registerDataMapper,
      activeHackathonDataMapper,
    );
    this.router = Router();
    this.routes(this.router);
  }


  public routes(app: Router): void {
    app.post(
      '/assign',
      (req, res, next) => this.verifyScannerPermissionsMiddleware(req, res, next, AclOperations.CREATE),
      (req, res, next) => this.addRfidAssignments(req, res, next),
    );
    app.post(
      '/scan',
      (req, res, next) => this.verifyScannerPermissionsMiddleware(
        req,
        res,
        next,
        AclOperations.CREATE,
      ),
      (req, res, next) => this.addScans(req, res, next),
    );
    
    app.get(
      '/events',
      (req, res, next) => this.verifyScannerPermissionsMiddleware(
        req,
        res,
        next,
        AclOperations.READ_ALL,
      ),
      (req, res, next) => this.getNextEventsHandler(req, res, next),
    );
    app.get(
      '/registrations',
      (req, res, next) => this.verifyScannerPermissionsMiddleware(req, res, next, AclOperations.READ_ALL),
      (req, res, next) => this.getAllRegistrationsHandler(res, next),
    );
    app.get(
      '/user',
      (req, res, next) => this.verifyScannerPermissionsMiddleware(req, res, next, AclOperations.READ_ALL),
      (req, res, next) => this.getUserByRfidBand(req, res, next),
      (req, res, next) => this.getUserByRfidBandHandler(req, res, next),
    );
    app.get(
      '/getpin',
      (req, res, next) => this.verifyScannerPermissionsMiddleware(
        req,
        res,
        next,
        AclOperations.READ_ALL,
      ),
      (req, res, next) => this.scanWorkshopByPin(req, res, next),
    );
    app.get(
      '/getevent_id',
      (req, res, next) => this.verifyScannerPermissionsMiddleware(
        req,
        res,
        next,
        AclOperations.READ_ALL,
      ),
      (req, res, next) => this.scanWorkshopByPin(req, res, next),
    );
  }

  
  /**
   * @api {post} /scanner/assign Assign RFID tags ID to users
   * @apiVersion 2.0.0
   * @apiName Assign an RFID to a user
   *
   * @apiGroup Admin Scanner
   * @apiPermission TeamMemberPermission
   * @apiPermission ScannerPermission
   * @apiUse ApiKeyArgumentRequired
   * @apiUse AuthArgumentRequired
   * @apiParam {Array} assignments An array or single instance of RFID tags to User uid assignments
   * @apiParamExample {json} Request-Example:
   *     {
   *       "assignments": [
   *        {
   *         "wid": "1vyv2boy1v3b4oi12-1234lhb1234b",
   *         "uid": "nbG7b87NB87nB7n98Y7",
   *         "time": 1239712938120
   *       },
   *       { ... }
   *       ]
   *     }
   * @apiSuccess {RfidAssignment[]} data Array of rfid insertion results
   * @apiUse ResponseBodyDescription
   * @apiUse IllegalArgumentError
   */
  private async addRfidAssignments(req: Request, res: Response, next: NextFunction) {
    // Validate incoming request
    if (!req.body) {
      return Util.standardErrorHandler(new HttpError('Illegal request format', 400), next);
    }
    if (!req.body.assignments) {
      return Util.standardErrorHandler(
        new HttpError('Could not find assignment(s) to add', 400),
        next,
      );
    }

    try {
      const response = await this.scannerProcessor.processRfidAssignments(req.body.assignments);
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.standardErrorHandler(error, next);
    }
  }

  /**
   * @api {post} /scanner/scan Upload scans from the event
   * @apiVersion 2.0.0
   * @apiName Submit scans from the event
   *
   * @apiGroup Admin Scanner
   * @apiPermission TeamMemberPermission
   * @apiPermission ScannerPermission
   * @apiUse AuthArgumentRequired
   * @apiUse ApiKeyArgumentRequired
   * @apiParam {Array} scans An array of scan objects
   * @apiParamExample {json} Request-Example:
   *     {
   *       "scans": [
   *        {
   *         "wid": "1vyv2boy1v3b4oi12-1234lhb1234b",
   *         "scan_event": "nbG7b87NB87nB7n98Y7",
   *         "scan_time": 1239712938120
   *         "scan_location": 5
   *        },
   *        { ... }
   *     ]
   *   }
   * @apiSuccess {Scans[]} data Array of scan insertion results
   * @apiUse ResponseBodyDescription
   * @apiUse IllegalArgumentError
   */
  private async addScans(req: Request, res: Response, next: NextFunction) {
    // Validate incoming request
    if (!req.body) {
      return Util.standardErrorHandler(new HttpError('Illegal request format', 400), next);
    }
    if (!req.body.scans) {
      return Util.standardErrorHandler(
        new HttpError('Could not find scan(s) to add', 400),
        next,
      );
    }

    try {
      const response = await this.scannerProcessor.processScans(req.body.scans);
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.standardErrorHandler(error, next);
    }
  }

 
  /**
   * @api {get} /scanner/registrations Obtain all registrations
   * @apiVersion 2.0.0
   * @apiName Obtain all registrations (Scanner)
   * @apiGroup Admin Scanner
   * @apiPermission TeamMemberPermission
   * @apiPermission ScannerPermission
   * @apiUse AuthArgumentRequired
   * @apiUse ApiKeyArgumentRequired
   * @apiSuccess {Registration[]} data Array of current registrations
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */
  private async getAllRegistrationsHandler(res: Response, next: NextFunction) {
    let result: IDbResult<IUserStatistics[]>;
    try {
      result = await this.adminStatisticsDataMapper.getAllUserData({
        byHackathon: true,
        ignoreCache: true,
      });
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
    const response = new ResponseBody('Success', 200, result);
    return this.sendResponse(res, response);
  }

  /**
   * @api {get} /admin/scanner/user Obtain user by rfid band
   * @apiVersion 2.0.0
   * @apiName Obtain user information from Rfid band (Scanner)
   *
   * @apiGroup Admin
   * @apiPermission TeamMemberPermission
   *
   * @apiParam {Number} wid The RFID tag to look up
   * @apiUse AuthArgumentRequired
   * @apiSuccess {Registration} data The registered user associated with the RFID tag
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */
  private async getUserByRfidBandHandler(req: Request, res: Response, next: NextFunction) {
    if (!res.locals.registration) {
      return Util.standardErrorHandler(new HttpError('Invalid rfid band', 400), next);
    }
    try {
      const response = new ResponseBody('Success', 200, { result: 'Success',
        data: res.locals.registration,
      });
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * @api {get} /scanner/events Obtain relevant events
   * @apiVersion 2.0.0
   * @apiName Obtain all relevant events (Scanner)
   * @apiParam {Boolean} [filter] Whether to filter for relevant events or return all
   * @apiGroup Admin Scanner
   * @apiPermission TeamMemberPermission
   * @apiPermission ScannerPermission
   * @apiUse AuthArgumentRequired
   * @apiUse ApiKeyArgumentRequired
   * @apiSuccess {Event[]} data Array of current events
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */
  private async getNextEventsHandler(req: Request, res: Response, next: NextFunction) {
    try {
      const response = await this.scannerProcessor.getRelevantEvents(req.query.filter);
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * @api {get} /scanner/getpin Get a user's registration by their pin
   * @apiVersion 2.0.0
   * @apiName Get User by Pin (Scanner)
   * @apiParam {Number} pin Current pin for the registration
   * @apiGroup Admin Scanner
   * @apiPermission TeamMemberPermission
   * @apiPermission ScannerPermission
   * @apiUse AuthArgumentRequired
   * @apiUse ApiKeyArgumentRequired
   * @apiSuccess {Registration} data The relevant registration for the provided pin
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */
  private async scanWorkshopByPin(req: Request, res: Response, next: NextFunction) {
    if ((!req.query.pin || !parseInt(req.query.pin, 11)) && parseInt(req.query.pin, 11) !== 0) {
      return Util.standardErrorHandler(
        new HttpError('Could not find pin to query by', 400),
        next,
      );
    }
    
    if ((!req.query.event_id || req.query.event_id.length != 45) && ((req.query.event_id.length == 45) && req.query.event_id !== '0')) {
      return Util.standardErrorHandler(
        new HttpError('Could not find event id to query by', 400),
        next,
      );
    }
    
    try {
      const hackathon = await this.activeHackathonDataMapper.activeHackathon.toPromise();
      //squel stuff, send 
      squel.insert()
      .into(this.tableName)
      .set("event_id", req.query.event_id)
      .set("hackathon_id", hackathon)
      .set("timestamp", Date.now())
      .set("user_pin", req.query.pin);
     
    
      
      /*const responseBody = new ResponseBody (
        'Success',
        200,

      );*/
      
      //return this.sendResponse(res, responseBody);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }
  public getByPin(pin: number, hackathon: Hackathon): Promise<IDbResult<Registration>> {
    const query = squel.select({
      autoQuoteFieldNames: false,
      autoQuoteTableNames: true,
    })
      .from(this.tableName)
      .where('hackathon = ?', hackathon.uid)
      .where('pin = ?', hackathon.base_pin! + pin)
      .toParam();
    return from(this.sql.query<Registration>(
      query.text,
      query.values,
      { cache: true },
    ))
      .pipe(
        map((registration: Registration[]) => ({ result: 'Success', data: registration[0] })),
      )
      .toPromise();
  }
}