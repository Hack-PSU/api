import express from 'express';
import { Inject, Injectable } from 'injection-js';
import { HttpError } from '../../../JSCommon/errors';
import { Util } from '../../../JSCommon/util';
import { Event } from '../../../models/event/event';
import { Url } from '../../../models/url/url';
import { UrlDataMapperImpl } from '../../../models/url/url-data-mapper-impl';
import { IFirebaseAuthService } from '../../../services/auth/auth-types/';
import { AclOperations, IAclPerm } from '../../../services/auth/RBAC/rbac-types';
import { IDataMapper, IDataMapperHackathonSpecific } from '../../../services/database';
import { ResponseBody } from '../../router-types';
import { LiveController } from '../controllers';

@Injectable()
export class EventsController extends LiveController {

  protected static baseRoute: string = 'events/';

  constructor(
    @Inject('IAuthService') private readonly authService: IFirebaseAuthService,
    @Inject('IEventDataMapper') private readonly dataMapper: IDataMapperHackathonSpecific<Event>,
    @Inject('IEventDataMapper') private readonly aclPerm: IAclPerm,
    @Inject('IUrlDataMapper') private readonly urlDataMapper: UrlDataMapperImpl,
  ) {
    super();
    this.routes(this.router);
  }

  public routes(app: express.Router): void {
    if (!this.authService) {
      return;
    }
    if (!this.dataMapper) {
      return;
    }
    // Unauthenticated route
    app.get('/', (req, res, next) => this.getEventHandler(req, res, next));
    // Use authentication
    app.use((req, res, next) => this.authService.authenticationMiddleware(req, res, next));
    // Authenticated routes
    app
      .post(
        '/',
        this.authService.verifyAcl(this.aclPerm, AclOperations.CREATE),
        (req, res, next) => this.postEventHandler(req, res, next),
      )
      .post(
        '/update',
        this.authService.verifyAcl(this.aclPerm, AclOperations.UPDATE),
        (req, res, next) => this.updateEventHandler(req, res, next),
      )
      .post(
        '/delete',
        this.authService.verifyAcl(this.aclPerm, AclOperations.DELETE),
        (req, res, next) => this.deleteEventHandler(req, res, next),
      );
  }

  /**
   * Delete an event
   * @api {post} /live/events/delete Delete an existing event
   * @apiVersion 2.0.0
   * @apiName Delete Event
   * @apiGroup Events
   * @apiPermission TeamMemberPermission
   *
   * @apiParam {String} uid The uid of the event.
   * @apiParam {String} [hackathon=current] The hackathon to delete the event from
   * @apiUse AuthArgumentRequired
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */
  private async deleteEventHandler(
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) {
    if (!request.body || !request.body.uid) {
      return Util.standardErrorHandler(new HttpError('Event uid must be provided', 400), next);
    }
    try {
      await this.urlDataMapper.deleteByEvent(request.body.uid);
      const result = await this.dataMapper.delete(request.body);
      const res = new ResponseBody('Success', 200, result);
      return this.sendResponse(response, res);
    } catch (error) {
      Util.standardErrorHandler(error, next);
    }
  }

  /**
   * Updates an existing event
   * @api {post} /live/events/update Update an existing event
   * @apiVersion 2.0.0
   * @apiName Update Event
   * @apiGroup Events
   * @apiPermission TeamMemberPermission
   *
   * @apiParam {String} uid The uid of the event.
   * @apiParam {Number} eventLocation The uid of the location for the event.
   * @apiParam {Number} eventStartTime The unix time for the start of the event.
   * @apiParam {Number} eventEndTime The unix time for the start of the event.
   * @apiParam {String} eventTitle The title of the event.
   * @apiParam {String} [eventDescription] The description of the event.
   * @apiParam {String} [wsPresenterNames] The names of workshop presenters.
   * @apiParam {String} [wsSkillLevel] The approximate skill level of a workshop.
   * @apiParam {String} [wsRelevantSkills] The relevant skills needed for a workshop
   * @apiParam {String} [wsUrls] The download links for workshop materials separated by '|'. Replaces all old urls.
   * @apiParam {String} [eventIcon] The URL for the icon image
   * @apiParam {Enum} eventType The type of the event. Accepted values: ["food","workshop","activity"]
   * @apiUse AuthArgumentRequired
   * @apiSuccess {Event} data The updated event
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */
  private async updateEventHandler(
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) {
    if (!request.body.uid) {
      return Util.standardErrorHandler(new HttpError('Event uid must be provided', 400), next);
    }
    let urls: string[] | undefined;
    if (request.body.wsUrls) {
      try {
        urls = (request.body.wsUrls as string).split('|');
      } catch (error) {
        return Util.standardErrorHandler(new HttpError('Failed to parse workshop URLs', 400), next);
      }
    }

    let event;
    try {
      event = new Event(request.body);
    } catch (error) {
      return Util.standardErrorHandler(new HttpError('Some properties were not as expected', 400), next);
    }
    try {
      const result = await this.dataMapper.update(event);
      if (urls) {
        try {
          await this.urlDataMapper.deleteByEvent(event.id);
        } catch (error) {
          // Event had no previous urls
        }
        urls.forEach(url => this.urlDataMapper.insert(new Url({ eventId: event.id, url })));
        result.data.ws_urls = urls;
      } else {
        try {
          const oldUrls = await this.urlDataMapper.getByEvent(event.id);
          result.data.ws_urls = oldUrls.data.map(url => url.url);
        } catch (error) {
          // Event had no previous urls
        }
      }
      const res = new ResponseBody('Success', 200, result);
      return this.sendResponse(response, res);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * Create a new event
   * @api {post} /live/events/ Add a new event
   * @apiVersion 2.0.0
   * @apiName New Event
   * @apiGroup Events
   * @apiPermission TeamMemberPermission
   *
   * @apiParam {Number} eventLocation The uid of the location for the event.
   * @apiParam {Number} eventStartTime The unix time for the start of the event.
   * @apiParam {Number} eventEndTime The unix time for the start of the event.
   * @apiParam {String} eventTitle The title of the event.
   * @apiParam {String} eventDescription The description of the event.
   * @apiParam {String} [wsPresenterNames] The names of workshop presenters.
   * @apiParam {String} [wsSkillLevel] The approximate skill level of a workshop.
   * @apiParam {String} [wsRelevantSkills] The relevant skills needed for a workshop
   * @apiParam {String} [wsUrls] The download links for workshop materials separated by '|'.
   * @apiParam {String} eventIcon The URL for the icon image
   * @apiParam {Enum} eventType The type of the event. Accepted values: ["food","workshop","activity"]
   * @apiParam {String} [hackathon] Optional uid of hackathon
   * @apiUse AuthArgumentRequired
   * @apiSuccess {Event} data The inserted event
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */
  private async postEventHandler(
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) {
    if (!request.body.eventLocation) {
      return Util.standardErrorHandler(new HttpError('Event location must be provided', 400), next);
    }
    if (!request.body.eventStartTime) {
      return Util.standardErrorHandler(new HttpError('Event start time must be provided', 400), next);
    }
    if (!request.body.eventEndTime) {
      return Util.standardErrorHandler(new HttpError('Event end time must be provided', 400), next);
    }
    if (!request.body.eventTitle) {
      return Util.standardErrorHandler(new HttpError('Event title must be provided', 400), next);
    }
    if (!request.body.eventDescription) {
      return Util.standardErrorHandler(new HttpError('Event description must be provided', 400), next);
    }
    if (!request.body.eventType) {
      return Util.standardErrorHandler(new HttpError('Event type must be provided', 400), next);
    }
    if (isNaN(Number(request.body.eventLocation))) {
      return Util.standardErrorHandler(new HttpError('Event location must be a parsable number', 400), next);
    }

    let urls: string[] | undefined;
    if (request.body.wsUrls && request.body.eventType === 'workshop') {
      try {
        urls = (request.body.wsUrls as string).split('|');
      } catch (error) {
        return Util.standardErrorHandler(new HttpError('Failed to parse workshop URLs', 400), next);
      }
    }

    let event;
    try {
      event = new Event(request.body);
    } catch (error) {
      return Util.standardErrorHandler(new HttpError('Some properties were not as expected', 400), next);
    }
    try {
      const result = await this.dataMapper.insert(event);
      if (urls) {
        urls.forEach(url => this.urlDataMapper.insert(new Url({ eventId: event.id, url })));
        result.data.ws_urls = urls;
      }
      const res = new ResponseBody('Success', 200, result);
      return this.sendResponse(response, res);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * This function gets all the events for the current hackathon
   * @api {get} /live/events/ Get all the events
   * @apiVersion 2.0.0
   * @apiName Get events
   * @apiGroup Events
   * @apiPermission UserPermission
   *
   * @apiSuccess {Event[]} data Array of current events
   * @apiUse RequestOpts
   * @apiUse ResponseBodyDescription
   */
  private async getEventHandler(
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) {
    try {
      const events = await this.dataMapper.getAll({
        byHackathon: !request.query.allHackathons,
        count: request.query.limit,
        hackathon: request.query.hackathon,
        startAt: request.query.offset,
        ignoreCache: request.query.ignoreCache,
      });
      try {
        const allUrls = (await this.urlDataMapper.getAll()).data;
        for (const event of events.data) {
          event.ws_urls = allUrls.filter(url => url.event_id === event.uid).map(url => url.url);
        }
      } catch {
        // There are no URLs at all
      }

      const res = new ResponseBody('Success', 200, events);
      return this.sendResponse(response, res);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }
}
