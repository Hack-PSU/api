import express from 'express';
import * as path from 'path';
import { Inject, Injectable } from 'injection-js';
import { HttpError } from '../../../JSCommon/errors';
import { Util } from '../../../JSCommon/util';
import { Constants } from '../../../assets/constants/constants';
import { Event } from '../../../models/event/event';
import { Url } from '../../../models/url/url';
import { UrlDataMapperImpl } from '../../../models/url/url-data-mapper-impl';
import { IStorageMapper, IStorageService } from '../../../services/storage/svc/storage.service';
import { IFirebaseAuthService } from '../../../services/auth/auth-types/';
import { AclOperations, IAclPerm } from '../../../services/auth/RBAC/rbac-types';
import { IDataMapperHackathonSpecific } from '../../../services/database';
import { ResponseBody } from '../../router-types';
import { LiveController } from '../controllers';
import { IActiveHackathonDataMapper } from 'models/hackathon/active-hackathon';
import { map } from 'rxjs/internal/operators/map';

@Injectable()
export class EventsController extends LiveController {

  protected static baseRoute: string = 'events/';
  private imageUploader: IStorageMapper;

  constructor(
    @Inject('IAuthService') private readonly authService: IFirebaseAuthService,
    @Inject('IEventDataMapper') private readonly dataMapper: IDataMapperHackathonSpecific<Event>,
    @Inject('IEventDataMapper') private readonly aclPerm: IAclPerm,
    @Inject('IUrlDataMapper') private readonly urlDataMapper: UrlDataMapperImpl,
    @Inject('IStorageService') private readonly storageService: IStorageService,
    @Inject('IActiveHackathonDataMapper') protected readonly activeHackathonDataMapper: IActiveHackathonDataMapper,
  ) {
    super();
    this.imageUploader = this.storageService.mapper({
      opts: {
        filename: (req) => {
          if (!req.body.filename) {
            throw new HttpError('Could not parse filename for image upload', 400);
          }
          return this.generateImageFileName(req.body.filename);
        },
        bucket: Constants.GCS.eventImageBucket,
        projectId: Constants.GCS.projectId,
        keyFilename: Constants.GCS.keyFile,
        metadata: {
          contentType: 'image/png',
          public: true,
          resumable: false,
          gzip: true,
        },
      },
      fieldName: 'image',
      fileFilter: file => path.extname(file.originalname) === '.png',
      fileLimits: { maxNumFiles: 1 },
      multipleFiles: false,
    });
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
    app.get('/get-by-uid', (req, res, next) => this.getEventByUidHandler(req, res, next));
    app.get('/', (req, res, next) => this.getEventHandler(req, res, next));
    // Use authentication
    app.use((req, res, next) => this.authService.authenticationMiddleware(req, res, next));
    // Authenticated routes
    app
      .post(
        '/',
        this.authService.verifyAcl(this.aclPerm, AclOperations.CREATE),
        (req, res, next) => this.postEventHandler(req, res, next),
      );
    app.post(
        '/update',
        this.authService.verifyAcl(this.aclPerm, AclOperations.UPDATE),
        (req, res, next) => this.updateEventHandler(req, res, next),
      );
    app.post(
        '/delete',
        this.authService.verifyAcl(this.aclPerm, AclOperations.DELETE),
        (req, res, next) => this.deleteEventHandler(req, res, next),
      );
    app.post(
      '/image', 
      // this.authService.verifyAcl(this.aclPerm, AclOperations.CREATE),
      this.imageUploader.upload(),
      (req, res, next) => this.postImageHandler(req, res, next),
    );
  }

  /**
   * Get an event by its uid
   * @api {get} /live/events/get-by-uid
   * @apiVersion 2.0.0
   * @apiName Get Event by Uid
   * @apiGroup Events
   * @apiPermission TeamMemberPermission
   * 
   * @apiParam {String} uid the Uid of the event
   * @apiParam {String} [hackathon=current] The hackathon to get the event from
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */
  private async getEventByUidHandler(
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) {
    if (!request.query || !request.query.uid) {
      return Util.standardErrorHandler(new HttpError('Event uid must be provided', 400), next);
    }
    try {
      const activeHackathonUid = await this.activeHackathonDataMapper.activeHackathon.pipe(
        map(hackathon => hackathon.uid)).toPromise();
      const result = await this.dataMapper.get({uid: request.query.uid, hackathon: request.query.hackathon || activeHackathonUid});
      return this.sendResponse(response, new ResponseBody('Success', 200, result));
    } catch (error) {
      Util.standardErrorHandler(error, next);
    }
  }

  /**
   * Delete an event
   * @api {post} /live/events/delete Delete an existing event
   * @apiVersion 2.0.0
   * @apiName Delete Event
   * @apiGroup Events
   * @apiPermission TeamMemberPermission
   *
   * @apiParam {String} uid The uid of the event
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

  /**
   * Insert an image for an event
   * @api {post} /live/events/image Add an event's image
   * @apiVersion 2.0.0
   * @apiName Event Image
   * @apiGroup Events
   * @apiPermission TeamMemberPermission
   *
   * @apiParam {FILE} image The image file for the event (.png format)
   * @apiParam {String} filename the filename of the image
   * @apiParam {String} uid The uid of the event
   * @apiSuccess {String} the filename of the image
   * @apiUse AuthArgumentRequired
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */

  private async postImageHandler(request: express.Request, response: express.Response, next: express.NextFunction) {    
    
    if (!request.body.filename) {
      return Util.standardErrorHandler(new HttpError('Could not find filename', 400), next);
    }
    if (!request.body.uid) {
      return Util.standardErrorHandler(new HttpError('Could not find event uid', 400), next);
    }
    const fileURL = this.imageUploader.uploadedFileUrl(
      await this.generateImageFileName(request.body.filename),
    );

    let url: Url;
    try {
      url = new Url({url: fileURL, eventId: request.body.uid});
    } catch (error) {
      return Util.standardErrorHandler(new HttpError('Some properties were not as expected when creating URL', 400), next);
    }
    
    try {
      await this.urlDataMapper.insert(url);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
    
    const res = new ResponseBody('Success', 200, fileURL);
    return this.sendResponse(response, res);
  }

  private async generateImageFileName(filename: String) {
    return `${filename}.png`;
  }
}
