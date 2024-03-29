import { NextFunction, Request, Response, Router } from 'express';
import { Inject } from 'injection-js';
import { WebsocketPusher } from '../../../services/communication/websocket-pusher';
import { IExpressController } from '../..';
import { HttpError } from '../../../JSCommon/errors';
import { Util } from '../../../JSCommon/util';
import { Location } from '../../../models/location/location';
import { IFirebaseAuthService } from '../../../services/auth/auth-types';
import { AclOperations, IAclPerm, IAdminAclPerm } from '../../../services/auth/RBAC/rbac-types';
import { Logger } from '../../../services/logging/logging';
import { ParentRouter, ResponseBody } from '../../router-types';
import { ILocationDataMapper } from '../../../models/location/location-data-mapper-impl';

export class AdminLocationController extends ParentRouter implements IExpressController {
  public router: Router;

  constructor(
    @Inject('IAuthService') private readonly authService: IFirebaseAuthService,
    @Inject('WebsocketPusher') private readonly websocketPusher: WebsocketPusher,
    @Inject('ILocationDataMapper') private readonly locationDataMapper: ILocationDataMapper,
    @Inject('ILocationDataMapper') private readonly locationAcl: IAclPerm,
    @Inject('IAdminDataMapper') private readonly adminAcl: IAdminAclPerm,
    @Inject('BunyanLogger') private readonly logger: Logger,
  ) {
    super();
    this.router = Router();
    this.routes(this.router);
  }

  public routes(app: Router): void {
    app.get(
      '/',
      this.authService.verifyAcl(this.locationAcl, AclOperations.READ_ALL),
      (req, res, next) => this.getAllLocationsHandler(res, next),
    );

    app.post(
      '/',
      this.authService.verifyAcl(this.locationAcl, AclOperations.CREATE),
      (req, res, next) => this.insertLocationHandler(req, res, next),
    );

    app.post(
      '/update',
      this.authService.verifyAcl(this.locationAcl, AclOperations.CREATE),
      (req, res, next) => this.updateLocationHandler(req, res, next),
    );

    app.post(
      '/delete',
      this.authService.verifyAcl(this.locationAcl, AclOperations.DELETE),
      (req, res, next) => this.deleteLocationHandler(req, res, next),
    );
  }

  /**
   * @api {get} /admin/location Get the list of existing locations
   * @apiVersion 2.0.0
   * @apiName Get Location List
   * @apiGroup Admin Location
   * @apiPermission DirectorPermission
   *
   * @apiParam {Number} limit=Math.inf Limit to a certain number of responses
   * @apiParam {Number} offset=0 The offset to start retrieving users from. Useful for pagination
   * @apiParam {Boolean} ignoreCache=false Force a fresh query to retrieve data
   *
   * @apiUse AuthArgumentRequired
   * @apiSuccess {Location[]} data Array of locations
   * @apiUse ResponseBodyDescription
   */
  private async getAllLocationsHandler(res: Response, next: NextFunction) {
    try {
      const result = await this.locationDataMapper.getAll({
        count: res.locals.limit,
        startAt: res.locals.offset,
        ignoreCache: res.locals.ignoreCache,
      });
      const response = new ResponseBody('Success', 200, result);
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * @api {post} /admin/location Insert a new location
   * @apiVersion 2.0.0
   * @apiName Create Location
   * @apiGroup Admin Location
   * @apiPermission DirectorPermission
   *
   * @apiParam {String} locationName The name of the new location that is to be inserted into the database
   * @apiUse AuthArgumentRequired
   * @apiSuccess {Location} data The inserted location
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */
  private async insertLocationHandler(req: Request, res: Response, next: NextFunction) {
    if (!req.body) {
      return Util.standardErrorHandler(new HttpError('Illegal request format', 400), next);
    }
    if (!req.body.locationName) {
      return Util.standardErrorHandler(new HttpError('Cannot find Location Name', 400), next);
    }
    try {
      const locationObject = new Location(req.body);
      let result = await this.locationDataMapper.insert(locationObject);
      if (!result.data.uid) {
        result = await this.locationDataMapper.getByName(locationObject.location_name);
      }
      const response = new ResponseBody('Success', 200, result);
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.standardErrorHandler(error, next);
    }
  }

  /**
   * @api {post} /admin/location/update Update name of a location
   * @apiVersion 2.0.0
   * @apiName Update Location
   * @apiGroup Admin Location
   * @apiPermission DirectorPermission
   *
   * @apiParam {String} uid The uid that is having the name of the location associated with this id changed
   * @apiParam {String} locationName The new name that is being updated with the name associated with the uid
   * @apiUse AuthArgumentRequired
   * @apiSuccess {Location} data The updated location
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */
  private async updateLocationHandler(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    if (!req.body) {
      return Util.standardErrorHandler(new HttpError('Illegal request format', 400), next);
    }
    if (!req.body.uid) {
      return Util.standardErrorHandler(new HttpError('Could not find ID of location', 400), next);
    }
    if (!req.body.locationName) {
      return Util.standardErrorHandler(new HttpError('Could not find updated name of location', 400), next);
    }
    if (req.body.uid) {
      req.body.uid = parseInt(req.body.uid, 10);
    }
    try {
      const location = new Location(req.body);
      const result = await this.locationDataMapper.update(location);
      this.websocketPusher.sendUpdateRequest(
        WebsocketPusher.EVENTS, 
        [WebsocketPusher.ADMIN, WebsocketPusher.MOBILE],
        req.headers.idtoken as string,
      );
      const response = new ResponseBody('Success', 200, result);
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.standardErrorHandler(error, next);
    }
  }

  /**
   * @api {post} /admin/location/delete Remove a location
   * @apiVersion 2.0.0
   * @apiName Remove Location
   * @apiGroup Admin Location
   * @apiPermission DirectorPermission
   *
   * @apiParam {String} uid The uid of the location that is being selected for removal
   * @apiUse AuthArgumentRequired
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */
  private async deleteLocationHandler(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    if (!req.body) {
      return Util.standardErrorHandler(new HttpError('Illegal request format', 400), next);
    }
    if (!req.body.uid) {
      return Util.standardErrorHandler(new HttpError('Could not find ID of location', 400), next);
    }
    if (req.body.uid) {
      req.body.uid = parseInt(req.body.uid, 10);
    }
    try {
      const location = new Location(req.body);
      const result = await this.locationDataMapper.delete(location);
      const response = new ResponseBody('Success', 200, result);
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.standardErrorHandler(error, next);
    }
  }

}
