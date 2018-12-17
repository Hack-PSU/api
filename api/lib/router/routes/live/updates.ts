import express from 'express';
import { Inject, ReflectiveInjector } from 'injection-js';
import { IHackpsuRequest } from '../../../JSCommon/hackpsu-request';
import { Util } from '../../../JSCommon/util';
import { Event } from '../../../models/event/Event';
import { IAuthService } from '../../../services/auth/auth-types/';
import { AclOperations } from '../../../services/auth/RBAC/rbac-types';
import { ResponseBody } from '../../router-types';
import { LiveController } from './live';

class UpdatesController extends LiveController {
  constructor(@Inject('FirebaseAuthService') private authService: IAuthService) {
    super();
  }

  public routes(app: express.Router): void {
    // Unauthenticated route
    app.get('/reference', this.getUpdateReferenceHandler);
    // Use authentication
    app.use(this.authService.authenticationMiddleware);
    // Authenticated routes
    app
      .post(
        '/',
        this.authService.verifyAcl(Event.inst, AclOperations.CREATE),
        this.postEventHandler,
      )
      .put('/', this.authService.verifyAcl(Event.inst, AclOperations.UPDATE), this.putEventHandler)
      .post('/delete', this.deleteEventHandler);
  }

  /**
   * Delete an event
   * @api {post} /live/event/delete Delete an existing event
   * @apiVersion 1.0.0
   * @apiName Update Event
   * @apiGroup Events
   * @apiPermission TeamMemberPermission
   *
   * @apiParam {String} uid - The uid of the event.

   * @apiUse AuthArgumentRequired
   * @apiSuccess {String} Success
   * @apiUse IllegalArgumentError
   */
  private deleteEventHandler(
    request: IHackpsuRequest,
    response: express.Response,
    next: express.NextFunction,
  ) {
    if (!request.body || !request.body.uid) {
      return next(new HttpError('Event uid must be provided', 400));
    }
    const event = new Event({ uid: request.body.uid }, request.uow);
    event.delete()
      .then(() => {
        const res = new ResponseBody('Success', 200, event);
        return this.sendResponse(response, res);
      })
      .catch(err => Util.standardErrorHandler(err, next));
  }

  /**
   * Updates an existing event
   * @api {put} /live/event/ Update an existing event
   * @apiVersion 1.0.0
   * @apiName Update Event
   * @apiGroup Events
   * @apiPermission >= TeamMemberPermission
   *
   * @apiParam {String} uid - The uid of the event.
   * @apiParam {String} eventLocation - The uid of the location for the event.
   * @apiParam {String} eventStartTime - The unix time for the start of the event.
   * @apiParam {String} eventEndTime - The unix time for the start of the event.
   * @apiParam {String} eventTitle - The title of the event.
   * @apiParam {String} eventDescription - The description of the event.
   * @apiParam {Enum} eventType - The type of the event. Accepted values: ["food","workshop","activity"]
   * @apiUse AuthArgumentRequired
   * @apiSuccess {String} Success
   * @apiUse IllegalArgumentError
   */
  private putEventHandler(
    request: IHackpsuRequest,
    response: express.Response,
    next: express.NextFunction,
  ) {
    if (!request.body || !request.body.event) {
      return next(new HttpError('No event provided to update', 400));
    }
    const event = new Event(request.body, request.uow);
    event.update()
      .then(() => {
        const res = new ResponseBody('Success', 200, { event });
        return this.sendResponse(response, res);
      })
      .catch(err => errorHandler500(err, next));
  }

  /**
   * Create a new event
   * @api {post} /live/event/ Add a new event
   * @apiVersion 1.0.0
   * @apiName New Event
   * @apiGroup Events
   * @apiPermission >= TeamMemberPermission
   *
   * @apiParam {String} eventLocation - The uid of the location for the event.
   * @apiParam {String} eventStartTime - The unix time for the start of the event.
   * @apiParam {String} eventEndTime - The unix time for the start of the event.
   * @apiParam {String} eventTitle - The title of the event.
   * @apiParam {String} eventDescription - The description of the event.
   * @apiParam {Enum} eventType - The type of the event. Accepted values: ["food","workshop","activity"]
   * @apiUse AuthArgumentRequired
   * @apiSuccess {String} Success
   * @apiUse IllegalArgumentError
   */
  private postEventHandler(
    request: IHackpsuRequest,
    response: express.Response,
    next: express.NextFunction,
  ) {
    if (!request.body.eventLocation) {
      return next(new HttpError('Event location must be provided', 400));
    }
    if (!request.body.eventStartTime) {
      return next(new HttpError('Event start time must be provided', 400));
    }
    if (!request.body.eventEndTime) {
      return next(new HttpError('Event end time must be provided', 400));
    }
    if (!request.body.eventTitle) {
      return next(new HttpError('Event title must be provided', 400));
    }
    if (!request.body.eventDescription) {
      return next(new HttpError('Event description must be provided', 400));
    }
    if (!request.body.eventType) {
      return next(new HttpError('Event type must be provided', 400));
    }
    const event = new Event(request.body, request.uow);
    event
      .add()
      .then(result => {
        const res = new ResponseBody('Success', 200, { event, result });
        return this.sendResponse(response, res);
      })
      .catch(err => errorHandler500(err, next));
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
  private getUpdateReferenceHandler(
    request: IHackpsuRequest,
    response: express.Response,
    next: express.NextFunction,
  ) {
    Event.getAll(request.uow)
      .then(stream => {
        const res = new ResponseBody('Success', 200, stream);
        return this.sendResponse(response, res);
      })
      .catch(err => errorHandler500(err, next));
  }
}

const injector = ReflectiveInjector.resolveAndCreate([EventsController]);
LiveController.registerRouter('/events', injector.get(EventsController));
