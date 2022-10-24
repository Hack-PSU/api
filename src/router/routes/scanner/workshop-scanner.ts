import { NextFunction, Request, Response, Router } from 'express';
import { Inject, Injectable } from 'injection-js';
import { IWorkshopScansDataMapper } from '../../../models/workshops-scans/workshop-scanner-data-mapper';
import { ParentRouter } from '../../router-types';
import { MysqlUow } from '../../../services/database/svc/mysql-uow.service';
import { IExpressController, ResponseBody } from '../..';
import { HttpError } from '../../../JSCommon/errors';
import { Environment, Util } from '../../../JSCommon/util';
import { IActiveHackathonDataMapper } from '../../../models/hackathon/active-hackathon';
import { IFirebaseAuthService } from '../../../services/auth/auth-types';
import { AclOperations, IAclPerm } from '../../../services/auth/RBAC/rbac-types';
import { WorkshopScan } from '../../../models/workshops-scans/workshop-scans';
import { IRegisterDataMapper } from 'models/register';
import axios from 'axios';
@Injectable()
export class WorkshopScannerController extends ParentRouter implements IExpressController {
  public router: Router;
  protected notificationFunctionRoute = 'https://us-central1-hackpsu18.cloudfunctions.net/notifications/message/send';
  constructor(
    @Inject('IWorkshopScansDataMapper') private readonly aclPerm: IAclPerm,
    @Inject('IActiveHackathonDataMapper') private readonly activeHackathonDataMapper: IActiveHackathonDataMapper,
    @Inject('IAuthService') private readonly authService: IFirebaseAuthService,
    @Inject('IWorkshopScansDataMapper') private readonly workshopScansDataMapper: IWorkshopScansDataMapper,
    @Inject('MysqlUow') protected readonly sql: MysqlUow,
    @Inject('IRegisterDataMapper') private readonly registerDataMapper: IRegisterDataMapper,
  ) {
    super();
    this.router = Router();
    this.routes(this.router);
  }

  public routes(app: Router): void {
    app.use((req, res, next) => this.authService.authenticationMiddleware(req, res, next));
    app.get(
      // TODO: Should probably move this implementation to the Users route
      '/user',
      this.authService.verifyAcl(this.aclPerm, AclOperations.READ),
      (req, res, next) => this.getUserByPin(req, res, next),
    );
    app.post(
      '/check-in',
      this.authService.verifyAcl(this.aclPerm, AclOperations.CHECK_IN),
      (req, res, next) => this.scanWorkshopByWordPin(req, res, next),
    )
    // TODO: We should probably re-implmement the queries for the attendance tracking. Unsure 
    //       whether they should go here or in attendance, or part of some larger refactor
  }  

  /**
   * @api {get} /workshop/user Get a user's registration by their pin
   * @apiVersion 2.0.0
   * @apiName Get User by Pin (Scanner)
   * @apiParam {Number} pin Current pin for the registration
   * @apiParam {boolean} [relativePin=true] whether the pin is relative to the current hackathon's base pin
   * @apiGroup Admin Scanner
   * @apiPermission TeamMemberPermission
   * @apiPermission ScannerPermission
   * @apiUse AuthArgumentRequired
   * @apiUse ApiKeyArgumentRequired
   * @apiSuccess {Registration} data The relevant registration for the provided pin
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */
  private async getUserByPin(req: Request, res: Response, next: NextFunction) {
    if (!req.query.wordPin) {
      return Util.standardErrorHandler(
        new HttpError('Could not find pin to query by', 400),
        next,
      );
    }

    try {
      const hackathon = await this.activeHackathonDataMapper.activeHackathon.toPromise();
      var result;
      result = await this.registerDataMapper.getByWordPin(req.query.wordPin, hackathon.uid);
      return this.sendResponse(res, new ResponseBody('Success', 200, result));
    } catch(error) {
      return Util.errorHandler500(error, next);
    }
  }
  
  /**
   * @api {post} /workshop/check-in Inputs a users workshop attendance given a pin
   * @apiVersion 2.0.0
   * @apiName Scan Workshop By Pin (Scanner)
   * @apiParam {String} wordPin Current word pin for the user
   * @apiParam {String} eventUid uid of the event
   * @apiParam {Boolean} [relativePin=true] whether the pin is relative to the current hackathon's base pin  
   * @apiGroup Admin Scanner
   * @apiPermission TeamMemberPermission
   * @apiUse AuthArgumentRequired
   * @apiUse ApiKeyArgumentRequired
   * @apiSuccess {WorkshopScan} data A WorkshopScan insertion
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */
  private async scanWorkshopByWordPin(req: Request, res: Response, next: NextFunction) {
    if (!req.body.wordPin) {
      return Util.standardErrorHandler(
        new HttpError('Could not find valid word pin', 400),
        next,
      );
    }
    
    if (!req.body.eventUid || !req.body.eventUid.length || req.body.eventUid.length > 45 || req.body.eventUid == '0') {
      return Util.standardErrorHandler(
        new HttpError('Could not find valid event uid', 400),
        next,
      );
    }
    
    try {
      const activeHackathon = await this.activeHackathonDataMapper.activeHackathon.toPromise();
      const registration = await this.registerDataMapper.getByWordPin(req.body.wordPin, activeHackathon.uid);
      req.body.email = registration.data.email;
      const scan = new WorkshopScan(req.body); 
      if (req.body.relativePin && scan.user_pin) {
        scan.user_pin = scan.user_pin + ((activeHackathon).base_pin as number);
      }
      const result = await this.workshopScansDataMapper.insert(scan);
      const response = new ResponseBody('Success', 200, result);
      try { 
        // don't send push notifications when testing, since this involves calling an external function
        if (Util.getCurrentEnv() == Environment.PRODUCTION) {         
          const notificationParams = {userPin: req.body.pin, userWordPin: req.body.wordPin, title: "Check In", message: "You've just checked in to a workshop at HackPSU!"};
          const notificationHeaders = {headers: {idToken: req.headers.idtoken}};
          axios.post(this.notificationFunctionRoute, notificationParams, notificationHeaders);
        }
      } catch (error) {

      }
      return this.sendResponse(res, response);
      
    } catch (error) {
      if (error.status == 409 && error.message === 'duplicate objects not allowed') {
        return this.sendResponse(res, new ResponseBody('User has already checked in to this event', 409));
      } else {
        return Util.errorHandler500(error, next);
      }
    }
  }
}
