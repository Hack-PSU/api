import { NextFunction, Request, Response, Router } from 'express';
import { Inject } from 'injection-js';
import { IExpressController } from '../..';
import { HttpError } from '../../../JSCommon/errors';
import { IFirebaseAuthService } from '../../../services/auth/auth-types';
import { AclOperations, IAclPerm, IAdminAclPerm } from '../../../services/auth/RBAC/rbac-types';
import { IDataMapper } from '../../../services/database';
import { Logger } from '../../../services/logging/logging';
import { ParentRouter } from '../../router-types';

export class AdminLocationController extends ParentRouter implements IExpressController {
  public router: Router;

  constructor(
    @Inject('IAuthService') private readonly authService: IFirebaseAuthService,
    @Inject('ILocationDataMapper') private readonly locationDataMapper: IDataMapper<Location>,
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
      (req, res, next) => this.createLocationHandler(req, res, next),
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
   * @apiUse AuthArgumentRequired
   * @apiSuccess {Array} Array containing all locations in the database
   */
  private getAllLocationsHandler(res: Response, next: NextFunction) {
    // Location.getAll(req.uow, {
    //   count: res.locals.limit,
    //   startAt: res.locals.offset,
    // })
    //   .then(stream => streamHandler(stream, res, next))
    //   .catch(err => errorHandler500(err, next));
    next(new HttpError('This is not implemented yet', 501));
  }

  /**
   * @api {post} /admin/location Create a new location
   * @apiVersion 2.0.0
   * @apiName Create Location
   * @apiGroup Admin Location
   * @apiPermission DirectorPermission
   *
   * @apiParam {String} locationName - the name of the new location that is to be inserted into the database
   * @apiUse AuthArgumentRequired
   * @apiSuccess {String} Success
   * @apiUse IllegalArgumentError
   */
  private async createLocationHandler(req: Request, res: Response, next: NextFunction) {
    // if (!req.body ||
    //   !req.body.locationName ||
    //   req.body.locationName.length === 0) {
    //   const error = new Error();
    //   error.status = 400;
    //   error.body = 'Require a name for the location';
    //   return next(error);
    // }
    // const location = new Location({ locationName: req.body.locationName }, req.uow);
    // location.add()
    //   .then(() => {
    //     res.status(200)
    //       .send({ status: 'Success' });
    //   })
    //   .catch(errorHandler500);
    next(new HttpError('This is not implemented yet', 501));
  }

  /**
   * @api {post} /admin/location/update Update name of a location
   * @apiVersion 2.0.0
   * @apiName Update Location
   * @apiGroup Admin Location
   * @apiPermission DirectorPermission
   *
   * @apiParam {String} uid - the uid that is having the name of the location associated with this id changed
   * @apiParam {String} locationName - the new name that is being updated with the name associated with the uid
   * @apiUse AuthArgumentRequired
   * @apiSuccess {String} Success
   * @apiUse IllegalArgumentError
   */
  private async updateLocationHandler(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    // if (!req.body ||
    //   !req.body.uid ||
    //   !req.body.locationName ||
    //   req.body.locationName.length === 0 ||
    //   req.body.uid.length === 0) {
    //   const error = new Error();
    //   error.status = 400;
    //   error.body = 'Require the uid and/or name for the location';
    //   return next(error);
    // }
    // const location = new Location(req.body, req.uow);
    // location.update()
    //   .then(() => {
    //     res.status(200)
    //       .send({ status: 'Success' });
    //   })
    //   .catch(err => errorHandler500(err, next));
    next(new HttpError('This is not implemented yet', 501));
  }

  /**
   * @api {post} /admin/location/delete Remove a location
   * @apiVersion 2.0.0
   * @apiName Remove Location
   * @apiGroup Admin Location
   * @apiPermission DirectorPermission
   *
   * @apiParam {String} uid - the uid of the location that is being selected for removal
   * @apiUse AuthArgumentRequired
   * @apiSuccess {String} Success
   * @apiUse IllegalArgumentError
   */
  private async deleteLocationHandler(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    // if (!req.body ||
    //   !req.body.uid ||
    //   req.body.uid.length === 0) {
    //   const error = new Error();
    //   error.status = 400;
    //   error.body = 'Require the uid for the location';
    //   return next(error);
    // }
    // const location = new Location({ uid: req.body.uid }, req.uow);
    // location.delete()
    //   .then(() => {
    //     res.status(200)
    //       .send({ status: 'Success' });
    //   })
    //   .catch(err => errorHandler500(err, next));
    next(new HttpError('This is not implemented yet', 501));
  }

}
