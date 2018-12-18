import express from 'express';
import { Inject, Injectable } from 'injection-js';
import { IHackpsuRequest } from '../../../JSCommon/hackpsu-request';
import { Util } from '../../../JSCommon/util';
import { IEventDataMapper } from '../../../models/event';
import { Event } from '../../../models/event/Event';
import { EventDataMapperImpl } from '../../../models/event/EventDataMapperImpl';
import { IAuthService } from '../../../services/auth/auth-types/';
import { AclOperations } from '../../../services/auth/RBAC/rbac-types';
import { ResponseBody } from '../../router-types';
import { LiveController } from './live';

@Injectable()
class EventsController extends LiveController {
  constructor(
    @Inject('FirebaseAuthService') private authService: IAuthService,
    @Inject('EventDataMapperImpl') private dataMapper: IEventDataMapper,
  ) {
    super();
  }

  public routes(app: express.Router): void {
    // Unauthenticated route
    app.get('/', this.getEventHandler);
    // Use authentication
    app.use(this.authService.authenticationMiddleware);
    // Authenticated routes
    app
      .post(
        '/',
        this.authService.verifyAcl(Util.getInstance([EventDataMapperImpl]), AclOperations.CREATE),
        this.postEventHandler,
      )
      .put(
        '/',
        this.authService.verifyAcl(Util.getInstance([EventDataMapperImpl]), AclOperations.UPDATE),
        this.putEventHandler,
      )
      .post(
        '/delete',
        this.authService.verifyAcl(Util.getInstance([EventDataMapperImpl]), AclOperations.DELETE),
        this.deleteEventHandler,
      );
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
  private async deleteEventHandler(
    request: IHackpsuRequest,
    response: express.Response,
    next: express.NextFunction,
  ) {
    if (!request.body || !request.body.uid) {
      return next(new HttpError('Event uid must be provided', 400));
    }
    try {
      await this.dataMapper.delete(request.body.uid);
      const res = new ResponseBody('Success', 200, request.body.uid);
      return this.sendResponse(response, res);
    } catch (error) {
      Util.standardErrorHandler(error, next);
    }
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
  private async putEventHandler(
    request: IHackpsuRequest,
    response: express.Response,
    next: express.NextFunction,
  ) {
    if (!request.body || !request.body.event) {
      return next(new HttpError('No event provided to update', 400));
    }
    const event = new Event(request.body);
    try {
      await this.dataMapper.update(event);
      const res = new ResponseBody('Success', 200, { event });
      return this.sendResponse(response, res);
    } catch (error) {
      errorHandler500(error, next);
    }
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
  private async postEventHandler(
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
    const event = new Event(request.body);
    try {
      const result = await this.dataMapper.insert(event);
      const res = new ResponseBody('Success', 200, { event, result });
      return this.sendResponse(response, res);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * This function gets all the events for the current hackathon
   * @api {get} /live/events/ Get all the events
   * @apiVersion 1.0.0
   * @apiName Get events
   * @apiGroup Events
   *
   * @apiSuccess {Array} Array of current events.
   */
  private async getEventHandler(
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

LiveController.registerRouter('/events', Util.getInstance([EventsController]));
