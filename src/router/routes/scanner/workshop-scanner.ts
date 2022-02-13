import { NextFunction, Request, Response, Router } from 'express';
import { Inject, Injectable } from 'injection-js';
import { IWorkshopScansDataMapper, WorkshopDataMapperImpl } from '../../../models/workshops-scans/workshop-scanner-data-mapper';
import { ParentRouter } from '../../router-types';
import { MysqlUow } from '../../../services/database/svc/mysql-uow.service';
import { IExpressController, ResponseBody } from '../..';
import { HttpError } from '../../../JSCommon/errors';
import { Util } from '../../../JSCommon/util';
import { IActiveHackathonDataMapper } from '../../../models/hackathon/active-hackathon';
import { IFirebaseAuthService } from '../../../services/auth/auth-types';
import { AclOperations, IAclPerm } from '../../../services/auth/RBAC/rbac-types';
import { WorkshopScan } from '../../../models/workshops-scans/workshop-scans';
import { IRegisterDataMapper } from 'models/register';
@Injectable()
export class WorkshopScannerController extends ParentRouter implements IExpressController {
  public router: Router;
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
      (req, res, next) => this.scanWorkshopByPin(req, res, next),
    )
    // TODO: We should probably re-implmement the queries for the attendance tracking. Unsure 
    //       whether they should go here or in attendance, or part of some larger refactor
  }  

  /**
   * @api {get} /workshop/user Get a user's registration by their pin
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
  private async getUserByPin(req: Request, res: Response, next: NextFunction) {
    if ((!req.query.pin || !parseInt(req.query.pin, 10)) && parseInt(req.query.pin, 10) !== 0) {
      return Util.standardErrorHandler(
        new HttpError('Could not find pin to query by', 400),
        next,
      );
    }

    try {
      const hackathon = await this.activeHackathonDataMapper.activeHackathon.toPromise();
      const result = await this.registerDataMapper.getByPin(req.query.pin, hackathon.uid);
      return this.sendResponse(res, new ResponseBody('Success', 200, result));
    } catch(error) {
      return Util.errorHandler500(error, next);
    }
  }
  
  /**
   * @api {post} /workshop/check-in Inputs a users workshop attendance given a pin
   * @apiVersion 2.0.0
   * @apiName Scan Workshop By Pin (Scanner)
   * @apiParam {Number} pin Current pin for the user
   * @apiParam {String} eventUid uid of the event
   * @apiGroup Admin Scanner
   * @apiPermission TeamMemberPermission
   * @apiUse AuthArgumentRequired
   * @apiUse ApiKeyArgumentRequired
   * @apiSuccess {WorkshopScan} data A WorkshopScan insertion
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */
  private async scanWorkshopByPin(req: Request, res: Response, next: NextFunction) {
    if (!req.body.pin || !parseInt(req.body.pin, 10)) {
      return Util.standardErrorHandler(
        new HttpError('Could not find valid pin', 400),
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
      const scan = new WorkshopScan(req.body);
      const result = await this.workshopScansDataMapper.insert(scan);
      const response = new ResponseBody('Success', 200, result);
      return this.sendResponse(res, response);
      
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }
}