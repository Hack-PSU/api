import express from 'express';
import { Inject, Injectable } from 'injection-js';
import { HttpError, RouteNotImplementedError } from '../../../JSCommon/errors';
import { Util } from '../../../JSCommon/util';
import { IUpdateDataMapper } from '../../../models/update';
import { Update } from '../../../models/update/update';
import { IFirebaseAuthService } from '../../../services/auth/auth-types/';
import { AclOperations, IAclPerm } from '../../../services/auth/RBAC/rbac-types';
import { IPushNotifService } from '../../../services/communication/push-notification';
import { Logger } from '../../../services/logging/logging';
import { ResponseBody } from '../../router-types';
import { LiveController } from '../controllers';

@Injectable()
export class UpdatesController extends LiveController {
  protected static baseRoute = 'updates/';

  constructor(
    @Inject('IAuthService') private authService: IFirebaseAuthService,
    @Inject('IUpdateDataMapper') private dataMapper: IUpdateDataMapper,
    @Inject('IUpdateDataMapper') private acl: IAclPerm,
    @Inject('IPushNotifService') private notificationService: IPushNotifService,
    @Inject('BunyanLogger') private logger: Logger,
  ) {
    super();
    this.routes(this.router);
  }

  public routes(app: express.Router): void {
    if (!this.authService || !this.dataMapper || !this.acl || !this.notificationService) {
      return;
    }
    // Unauthenticated route
    app.get('/reference', (req, res, next) => this.getUpdateReferenceHandler(req, res, next));
    // Use authentication
    app.use((req, res, next) => this.authService.authenticationMiddleware(req, res, next));
    // Authenticated routes
    app
      .get(
        '/',
        this.authService.verifyAcl(this.acl, AclOperations.READ),
        (req, res, next) => this.getUpdateHandler(req, res, next),
      )
      .post(
        '/',
        this.authService.verifyAcl(this.acl, AclOperations.CREATE),
        (req, res, next) => this.postUpdateHandler(req, res, next),
      )
      .put(
        '/',
        this.authService.verifyAcl(this.acl, AclOperations.UPDATE),
        (req, res, next) => this.putEventHandler(req, res, next),
      )
      .post(
        '/delete',
        this.authService.verifyAcl(this.acl, AclOperations.DELETE),
        (req, res, next) => this.deleteEventHandler(req, res, next),
      );
  }

  private deleteEventHandler(
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) {
    next(new RouteNotImplementedError('Update deletion is not supported at this time'));
  }

  private putEventHandler(
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) {
    next(new RouteNotImplementedError('Update editing is not supported at this time'));
  }

  /**
   * @api {post} /live/updates/ Add a new update
   * @apiVersion 1.0.0
   * @apiName New update
   * @apiGroup Updates
   * @apiPermission TeamMemberPermission
   *
   * @apiParam {String} updateTitle - The title of the update
   * @apiParam {String} updateText - The text of the update
   * @apiParam {String} [updateImage] - The url of the image part of the update.
   * @apiParam {Boolean} [pushNotification] - Whether to send out a push notification with this update.
   * @apiUse AuthArgumentRequired
   * @apiSuccess {String} Success
   * @apiUse IllegalArgumentError
   */
  private async postUpdateHandler(
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) {
    if (!request.body || !request.body.updateTitle) {
      return next(new HttpError('Update title must be provided', 400));
    }
    if (!request.body.updateText) {
      return next(new HttpError('Update message must be provided', 400));
    }
    if (!request.body.updateImage) {
      request.body.updateImage = 'https://app.hackpsu.org/assets/images/logo.svg';
    }
    const generatedUpdate = new Update(request.body);
    try {
      const update = await this.dataMapper.insert(generatedUpdate);
      // Send out push notification and pass along stream
      if (generatedUpdate.push_notification) {
        try {
          await this.notificationService.sendNotification(
            generatedUpdate.update_title,
            generatedUpdate.update_text,
          );
        } catch (error) {
          this.logger.error(error);
        }
      }
      const res = new ResponseBody('Success', 200, update);
      return this.sendResponse(response, res);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * This function gets the Firebase Database reference for live updates
   * @api {get} /live/updates/reference Get the db reference for updates
   * @apiVersion 1.0.0
   * @apiName Get Update reference
   * @apiGroup Updates
   *
   * @apiSuccess {String} The database reference to the current updates.
   */
  private async getUpdateReferenceHandler(
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) {
    try {
      const reference = await this.dataMapper.getReference();
      const res = new ResponseBody('Success', 200, reference);
      return this.sendResponse(response, res);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * @api {get} /live/updates/ Get all the updates
   * @apiVersion 1.0.0
   * @apiName Get Updates
   * @apiGroup Updates
   * @apiPermission UserPermission
   *
   * @apiUse AuthArgumentRequired
   *
   * @apiSuccess {Array} Array of current updates.
   */
  private async getUpdateHandler(
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) {
    try {
      const stream = await this.dataMapper.getAll();
      const res = new ResponseBody('Success', 200, stream);
      return this.sendResponse(response, res);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }
}
