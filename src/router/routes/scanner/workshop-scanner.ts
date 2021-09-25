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
@Injectable()
export class WorkshopScannerController extends ParentRouter implements IExpressController {
  public router: Router;
  constructor(
    @Inject('IWorkshopScansDataMapper') private readonly aclPerm: IAclPerm,
    @Inject('IActiveHackathonDataMapper') private readonly activeHackathonDataMapper: IActiveHackathonDataMapper,
    @Inject('IAuthService') private readonly authService: IFirebaseAuthService,
    @Inject('IWorkshopScansDataMapper') private readonly workshopScansDataMapper: IWorkshopScansDataMapper,
    @Inject('MysqlUow') protected readonly sql: MysqlUow,
  ) {
    super();
    this.router = Router();
    this.routes(this.router);
  }

  public routes(app: Router): void {
    app.get(
      // TODO: Should probably move this implementation to the Users route
      '/user',
      this.authService.verifyAcl(this.aclPerm, AclOperations.READ),
      (req, res, next) => this.getUserByPin(req, res, next),
    );
    app.get(
      // TODO: Consider moving this to the Events route?
      '/event',
      this.authService.verifyAcl(this.aclPerm, AclOperations.READ),
      (req, res, next) => this.getEvent(req, res, next),
    );
    app.get(
      '/check-in',
      this.authService.verifyAcl(this.aclPerm, AclOperations.CHECK_IN),
      (req, res, next) => this.scanWorkshopByPin(req, res, next),
    )
    // TODO: We should probably re-implmement the queries for the attendance tracking. Unsure 
    //       whether they should go here or in attendance, or part of some larger refactor
  }  

  /**
   * @api {get} /workshop/getpin Get a user's registration by their pin
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
    // do input validation

    // call function to create and execute the query

    const hackathon = await this.activeHackathonDataMapper.activeHackathon.toPromise();
    // const result = await this.workshopScansDataMapper.getByPin(<put arguments here>);
    
    // return the result as an api response. If we catch an error instead, return a 500 code
  }

  // Documentation goes here
  private async getEvent(req: Request, res: Response, next: NextFunction) {
    // write your function here

    //const result = await this.workshopScansDataMapper.getEvent(<put arguments here>);
  }
  
  // Documentation goes here
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
 
      // create a WorkshopScans object
      // const scan = new WorkshopScan(<data>)

      // Pass that object to the insertion function
      // const result = this.workshopScansDataMapper.insert(scan);

      // constrct a successful api response
      /*const responseBody = new ResponseBody (
        'Success',
        200,

      );*/
      
      //return this.sendResponse(res, responseBody);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }
}