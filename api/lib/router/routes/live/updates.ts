import express from 'express';
import { Inject, Injectable } from 'injection-js';
import { RouteNotImplementedError } from '../../../JSCommon/errors';
import { IHackpsuRequest } from '../../../JSCommon/hackpsu-request';
import { Util } from '../../../JSCommon/util';
import { IUpdateDataMapper } from '../../../models/update';
import { Update } from '../../../models/update/Update';
import { UpdateDataMapperImpl } from '../../../models/update/UpdateDataMapperImpl';
import { IAuthService } from '../../../services/auth/auth-types/';
import { AclOperations } from '../../../services/auth/RBAC/rbac-types';
import { logger } from '../../../services/logging/logging';
import { ResponseBody } from '../../router-types';
import { LiveController } from './live';

@Injectable()
class UpdatesController extends LiveController {
  constructor(
    @Inject('FirebaseAuthService') private authService: IAuthService,
    @Inject('UpdateDataMapperImpl') private dataMapper: IUpdateDataMapper,
  ) {
    super();
  }

  public routes(app: express.Router): void {
    // Unauthenticated route
    app.get('/reference', this.getUpdateReferenceHandler);
    // Use authentication
    app.use(this.authService.authenticationMiddleware);
    // Authenticated routes
    app
      .get(
        '/',
        this.authService.verifyAcl(Util.getInstance([UpdateDataMapperImpl]), AclOperations.READ),
        this.getUpdateHandler,
      )
      .post(
        '/',
        this.authService.verifyAcl(Util.getInstance([UpdateDataMapperImpl]), AclOperations.CREATE),
        this.postUpdateHandler,
      )
      .put(
        '/',
        this.authService.verifyAcl(Util.getInstance([UpdateDataMapperImpl]), AclOperations.UPDATE),
        this.putEventHandler,
      )
      .post(
        '/delete',
        this.authService.verifyAcl(Util.getInstance([UpdateDataMapperImpl]), AclOperations.DELETE),
        this.deleteEventHandler,
      );
  }

  private deleteEventHandler(
    request: IHackpsuRequest,
    response: express.Response,
    next: express.NextFunction,
  ) {
    next(new RouteNotImplementedError('Update deletion is not supported at this time'));
  }

  private putEventHandler(
    request: IHackpsuRequest,
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
    request: IHackpsuRequest,
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
          await sendNotification(generatedUpdate.update_title, generatedUpdate.update_text);
        } catch (error) {
          logger.error(error);
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
    request: IHackpsuRequest,
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
    request: IHackpsuRequest,
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

LiveController.registerRouter('/events', Util.getInstance([UpdatesController]));
