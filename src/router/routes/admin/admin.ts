import axios from 'axios';
import { validate } from 'email-validator';
import { NextFunction, Request, Response, Router } from 'express';
import { Inject, Injectable } from 'injection-js';
import { Organizer } from '../../../models/admin/organizer';
import { IOrganizerDataMapper } from 'models/admin/organizer-data-mapper-impl';
import { IExpressController, ResponseBody } from '../..';
import { HttpError } from '../../../JSCommon/errors';
import { Util } from '../../../JSCommon/util';
import { IAdminDataMapper } from '../../../models/admin';
import { ExtraCreditAssignment } from '../../../models/extra-credit/extra-credit-assignment';
import { IAdminProcessor } from '../../../processors/admin-processor';
import { IFirebaseAuthService } from '../../../services/auth/auth-types';
import { AclOperations, IAclPerm, IAdminAclPerm } from '../../../services/auth/RBAC/rbac-types';
import { IDataMapper } from '../../../services/database';
import { ParentRouter } from '../../router-types';
import { ICustomPermissions } from 'services/auth';

@Injectable()
export class AdminController extends ParentRouter implements IExpressController {
  protected static baseRoute = 'admin/';
  protected static notificationFunctionRoute = 'https://us-central1-hackpsu18.cloudfunctions.net/notifications/message/send';

  private static parseCommonRequestFields(
    request: Request,
    response: Response,
    next: NextFunction,
  ) {
    if (!request.query.limit || parseInt(request.query.limit, 10)) {
      response.locals.limit = parseInt(request.query.limit, 10);
    } else {
      const error = new HttpError('Limit must be an integer', 400);
      return Util.standardErrorHandler(error, next);
    }
    if (!request.query.offset || parseInt(request.query.offset, 10)) {
      response.locals.offset = parseInt(request.query.offset, 10);
    } else {
      const error = new HttpError('Offset must be an integer', 400);
      return Util.standardErrorHandler(error, next);
    }
    if (request.query.hackathon) {
      response.locals.hackathon = request.query.hackathon;
    }
    if (request.query.ignoreCache) {
      response.locals.ignoreCache = request.query.ignoreCache;
    }
    response.locals.allHackathons = !!request.query.allHackathons;
    return next();
  }

  public router: Router;

  constructor(
    @Inject('IAuthService') private readonly authService: IFirebaseAuthService,
    @Inject('IAdminDataMapper') private readonly adminDataMapper: IAdminDataMapper,
    @Inject('IAdminDataMapper') private readonly adminAcl: IAdminAclPerm,
    @Inject('IAdminProcessor') private readonly adminProcessor: IAdminProcessor,
    @Inject('IExtraCreditDataMapper') private readonly extraCreditDataMapper: IDataMapper<ExtraCreditAssignment>,
    @Inject('IExtraCreditDataMapper') private readonly extraCreditAcl: IAclPerm,
    @Inject('IOrganizerDataMapper') private readonly organizerDataMapper: IOrganizerDataMapper,
    @Inject('IOrganizerDataMapper') private readonly organizerAcl,
  ) {
    super();
    this.router = Router();
    this.routes(this.router);
  }

  public routes(app: Router): void {
    if (!this.authService) {
      return;
    }
    // Use authentication
    app.use('/checkout', Util.getInstance('AdminCheckoutController').router);
    app.use((req, res, next) => this.authService.authenticationMiddleware(req, res, next));
    app.use((req, res, next) => AdminController.parseCommonRequestFields(req, res, next));
    AdminController.registerRouter('register', 'AdminRegisterController', 2);
    AdminController.registerRouter('data', 'AdminStatisticsController', 2);
    AdminController.registerRouter('hackathon', 'AdminHackathonController', 2);
    AdminController.registerRouter('location', 'AdminLocationController', 2);
    app.get('/', (req, res) => this.mainHandler(res));
    app.get(
      '/userid',
      this.authService.verifyAcl(this.adminAcl, AclOperations.GET_EMAIL),
      (req, res, next) => this.getUserIdHandler(req, res, next),
    );
    app.get(
      '/user-from-uid',
      this.authService.verifyAcl(this.organizerAcl, AclOperations.READ),
      (req, res, next) => this.getUserPrivilegeLevelHandler(req, res, next),
    )
    app.post(
      '/email',
      this.authService.verifyAcl(this.adminAcl, AclOperations.SEND_EMAIL),
      (req, res, next) => this.sendEmailHandler(req, res, next),
    );
    app.post(
      '/makeadmin',
      this.authService.verifyAcl(this.adminAcl, AclOperations.CREATE),
      (req, res, next) => this.makeAdminHandler(req, res, next),
    );
    app.post(
      '/mobile-notification',
      this.authService.verifyAcl(this.adminAcl, AclOperations.DELETE),
      (req, res, next) => this.mobilePushNotificationHandler(req, res, next),
    );
    app.get(
      '/organizers',
      this.authService.verifyAcl(this.organizerAcl, AclOperations.READ),
      (req, res, next) => this.getOrganizerByUidHandler(req, res, next),
    );
    app.post(
      '/organizers',
      this.authService.verifyAcl(this.organizerAcl, AclOperations.CREATE),
      (req, res, next) => this.insertOrganizerHandler(req, res, next),
    );
    app.get(
      '/organizers/all',
      this.authService.verifyAcl(this.organizerAcl, AclOperations.READ_ALL),
      (req, res, next) => this.getAllOrganizersHandler(req, res, next),
    );
    app.post(
      '/organizers/update',
      this.authService.verifyAcl(this.organizerAcl, AclOperations.CREATE),
      (req, res, next) => this.updateOrganizerHandler(req, res, next),
    );
    app.post(
      '/organizers/delete',
      this.authService.verifyAcl(this.organizerAcl, AclOperations.DELETE),
      (req, res, next) => this.deleteOrganizerHandler(req, res, next),
    );
  }

  /**
   * @api {get} /admin/ Get Authentication Status
   * @apiVersion 2.0.0
   * @apiName Get Authentication Status
   * @apiGroup Admin
   * @apiPermission TeamMemberPermission
   *
   * @apiUse AuthArgumentRequired
   *
   * @apiSuccess {UserRecord} data User details including privilege level
   * @apiUse ResponseBodyDescription
   */
  private mainHandler(res: Response) {
    const r = new ResponseBody(
      'Authorized admin',
      200,
      { result: 'Success', data: res.locals.user },
    );
    return this.sendResponse(res, r);
  }

  /**
   * @api {get} /admin/user-from-uid Get the user's privilege level
   * @apiVersion 2.0.0
   * @apiName Get User Privilege
   * @apiGroup Admin
   * @apiPermission TeamMemberPermission
   * @apiUse AuthArgumentRequired
   * @apiParam {String} uid The firebase uid of the user to get level of
   * @apiSuccess {UserRecord} Object {uid, displayName, privilege, admin}
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */
  private async getUserPrivilegeLevelHandler(req: Request, res: Response, next: NextFunction) {
    if (!req.query.uid) {
      return Util.standardErrorHandler(new HttpError('Could not find uid in query parameters.', 400), next);
    }
    try {
      const result = await this.authService.getUserById(req.query.uid);
      return this.sendResponse(res, new ResponseBody('Success', 200, { result: 'Success', data: result }));
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * @api {get} /admin/userid Get the firebase user record corresponding to an email
   * @apiVersion 2.0.0
   * @apiName Get User Id
   * @apiGroup Admin
   * @apiPermission TeamMemberPermission
   *
   * @apiUse AuthArgumentRequired
   * @apiParam {String} email The email to query user id by
   * @apiSuccess {UserRecord} Object {uid, displayName, privilege, admin}
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */
  private async getUserIdHandler(req: Request, res: Response, next: NextFunction) {
    if (!req.query ||
      !req.query.email ||
      !validate(req.query.email)) {
      return Util.standardErrorHandler(
        new HttpError('not a valid email to search', 400),
        next,
      );
    }
    try {
      const result = await this.adminDataMapper.getEmailFromId(req.query.email);
      const response = new ResponseBody(
        'Success',
        200,
        result,
      );
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * @api {post} /admin/email Send communication email to recipients
   * @apiVersion 2.0.0
   * @apiName Send communication emails
   *
   * @apiGroup Admin
   * @apiPermission DirectorPermission
   *
   * @apiUse AuthArgumentRequired
   * @apiParam {Object[]} emails An array of objects with the following schema { email: <email>, name: <name of person>, substitutions: {...} }
   *                   Substitutions is a map { keyword: substitute-text }
   * @apiParam {String} subject The subject of the email to send
   * @apiParam {String} html The HTML/text email to send. Make sure that all words that need to be substituted have matching substitutes in each object in the emails array
   *
   * @apiParamExample {Object} Request-Example:
   *                  {
   *                    emails: [{
   *                        email: abc@email.com,
   *                        name: Name,
   *                        substitutions: {
   *                          date: '29-03-2014',
   *                          language: 'english',
   *                          ...,
   *                          }
   *                        },
   *                        {...},
   *                        ...],
   *                    fromEmail: "IEmail address send from and reply to. *NOTE: email are case sensitive"
   *                    subject: "generic email",
   *                    html: "<html><head><body>.....</body></head></html>"
   *                  }
   * @apiSuccess (200) {Object[]} Responses All responses from the emails sent
   * @apiSuccess (207) {Object[]} Partial-Success An array of success responses as well as failure objects
   * @apiUse ResponseBodyDescription
   */

  /**
   * TODO: Future project: change this to be an orchestrated communication system that will
   *  take as parameters the channels to send the communication to and support multiple
   *  orchestrated communication channels.
   */
  private async sendEmailHandler(req: Request, res: Response, next: NextFunction) {
    // Validate incoming request
    if (!req.body) {
      return Util.standardErrorHandler(new HttpError('Illegal request format', 400), next);
    }
    if (!req.body.emails) {
      return Util.standardErrorHandler(new HttpError('Could not find email data to send', 400), next);
    }
    if (!req.body.html || typeof req.body.html !== 'string') {
      return Util.standardErrorHandler(new HttpError('Could not find email content to send', 400), next);
    }
    if (!req.body.subject) {
      return Util.standardErrorHandler(new HttpError('Could not find email subject to send', 400), next);
    }
    // Send the emails
    try {
      const response = await this.adminProcessor.validateAndSendEmails(
        req.body.emails,
        req.body.html,
        req.body.subject,
        req.body.fromEmail,
        res.locals.user.uid,
      );
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * @api {post} /admin/makeadmin Change a user's privileges
   * @apiVersion 2.0.0
   * @apiName Elevate user
   *
   * @apiGroup Admin
   * @apiPermission DirectorPermission
   *
   * @apiUse AuthArgumentRequired
   * @apiParam {String} uid The UID or email of the user to change admin privileges
   * @apiParam {Number} privilege The privilege level to set to {1: Volunteer, 2: Team Member, 3: Exec, 4: Tech-Exec, 5: Finance Director}
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */
  private async makeAdminHandler(req: Request, res: Response, next: NextFunction) {
    if (!req.body || !req.body.uid) {
      return Util.standardErrorHandler(new HttpError('Uid of new admin required', 400), next);
    }
    if (!req.body || !req.body.privilege) {
      return Util.standardErrorHandler(new HttpError('New privilege level required', 400), next);
    }
    try {
      const result = await this.adminDataMapper.modifyPermissions(
        req.body.uid,
        parseInt(req.body.privilege, 10),
        res.locals.user.privilege,
      );
      return this.sendResponse(res, new ResponseBody('Successfully changed the status.', 200, result));
    } catch (error) {
      return Util.standardErrorHandler(error, next);
    }
  }
  
  /**
   * @api {post} /admin/mobile-push-notification Send a push notification to a user
   * @apiVersion 2.0.0
   * @apiName Push Mobile Notification
   * @apiGroup Admin
   * @apiPermission DirectorPermission
   * 
   * @apiParam {Number} userPin the pin of the user to send a notification to
   * @apiParam {String} title the title of the notification to send
   * @apiParam {String} message the message included in the notification
   * 
   * @apiUse AuthArgumentRequired
   * @apiUse IllegalArgumentError
   */
   private async mobilePushNotificationHandler(req: Request, res: Response, next: NextFunction) {
    if (!req.body.userPin || !parseInt(req.body.userPin, 10)) {
      return Util.standardErrorHandler(new HttpError('Could not find valid pin.', 400), next);
    }
    if (!req.body.title) {
      return Util.standardErrorHandler(new HttpError('Could not find valid title.', 400), next);
    }
    if (!req.body.message) {
      return Util.standardErrorHandler(new HttpError('Could not find valid message.', 400), next);
    }

    const result = await axios.post(AdminController.notificationFunctionRoute, req);
    const responseBody = new ResponseBody(result.statusText, result.status, result.data);
    return this.sendResponse(res, responseBody);
  }

  /**
   * @api {post} /admin/organizers Insert an organizer with the given privilege level
   * @apiVersion 2.0.0
   * @apiName Add Organizer
   * @apiGroup Admin
   * @apiPermission DirectorPermission
   * 
   * @apiParam {String} uid the firebase uid of the organizer to add
   * @apiParam {String} email the email of the organizer to add
   * @apiParam {String} firstname the first name of the organizer to add
   * @apiParam {String} lastname the last name of the organizer to ad
   * 
   * @apiUse AuthArgumentRequired
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */
  private async insertOrganizerHandler(req: Request, res: Response, next: NextFunction) {
    if (!req.body.uid) {
      return Util.standardErrorHandler(new HttpError('Could not find uid in request.', 400), next);
    }
    
    let organizer;
    try {
      organizer = new Organizer(req.body);
    } catch (error) {
      return Util.standardErrorHandler(new HttpError('Some Organizer object fields were not as expected.', 400), next);
    }

    try {
      const result = await this.organizerDataMapper.insert(organizer);
      return this.sendResponse(res, new ResponseBody('Success', 200, result));
    } catch (error) {
      return Util.errorHandler500(error, next);
    }    
  }

  /**
   * @api {post} /admin/organizers/delete Delete the organizer with the given uid
   * @apiVersion 2.0.0
   * @apiName Delete Organizer
   * @apiGroup Admin
   * @apiPermission DirectorPermission
   * 
   * @apiParam {String} uid the firebase uid of the organizer to delete
   * 
   * @apiUse AuthArgumentRequired
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */
  private async deleteOrganizerHandler(req: Request, res: Response, next: NextFunction) {
    if (!req.body.uid) {
      return Util.standardErrorHandler(new HttpError('Could not find uid in request.', 400), next);
    }

    try {
      await this.adminDataMapper.modifyPermissions(req.body.uid, 1, res.locals.user.privilege);
      const result = await this.organizerDataMapper.delete(req.body.uid);
      return this.sendResponse(res, new ResponseBody('Success', 200, result));
    } catch (error) {
      return Util.errorHandler500(error, next);
    } 
  }

  /**
   * @api {get} /admin/organizers Retrieve the organizer with the given uid
   * @apiVersion 2.0.0
   * @apiName Get Organizer
   * @apiGroup Admin
   * @apiPermission DirectorPermission
   * 
   * @apiParam {String} uid the firebase uid of the organizer to retrieve
   * 
   * @apiUse AuthArgumentRequired
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */
  private async getOrganizerByUidHandler(req: Request, res: Response, next: NextFunction) {
    if (!req.query.uid) {
      return Util.standardErrorHandler(new HttpError('Could not find uid in request.', 400), next);
    }

    try {
      const result = await this.organizerDataMapper.get(req.query.uid);
      result.data.privilege = (
        (await this.authService.getUserById(result.data.uid)).customClaims as ICustomPermissions).privilege;
      return this.sendResponse(res, new ResponseBody('Success', 200, result));
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * @api {get} /admin/organizers/all Get all organizers
   * @apiVersion 2.0.0
   * @apiName Get All Organizers
   * @apiGroup Admin
   * @apiPermission DirectorPermission
   * 
   * @apiUse AuthArgumentRequired
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */
  private async getAllOrganizersHandler(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.organizerDataMapper.getAll();
      for (const organizer of result.data) {
        try {
          organizer.privilege = ((await this.authService.getUserById(organizer.uid))
            .customClaims as ICustomPermissions).privilege;
        } catch (error) {
          // if the user does not exist in firebase, then set their privilege level to 0
          organizer.privilege = 0;
        }
      }
      
      return this.sendResponse(res, new ResponseBody('Success', 200, result));
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * @api {post} /admin/organizers/update Update an organizer with the given information
   * @apiVersion 2.0.0
   * @apiName Delete Organizer
   * @apiGroup Admin
   * @apiPermission DirectorPermission
   * 
   * @apiParam {String} uid the firebase uid of the organizer to add
   * @apiParam {String} email the email of the organizer to add
   * @apiParam {String} firstname the first name of the organizer to add
   * @apiParam {String} lastname the last name of the organizer to add
   * 
   * @apiUse AuthArgumentRequired
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */
  private async updateOrganizerHandler(req: Request, res: Response, next: NextFunction) {
    if (!req.body.uid) {
      return Util.standardErrorHandler(new HttpError('Could not find uid in request.', 400), next);
    }

    let organizer;
    try {
      organizer = new Organizer(req.body);
    } catch (error) {
      return Util.standardErrorHandler(new HttpError('Some Organizer object fields were not as expected.', 400), next);
    }

    try {
      // only attempt to update permissions if permissions are given
      // if (req.body.permission) {
      //   if (!parseInt(req.body.permission, 10)) {
      //     return Util.standardErrorHandler(new HttpError('Permission could not be parsed as a base-10 integer.', 400), next);
      //   }
        // await this.adminDataMapper.modifyPermissions(req.body.uid, parseInt(req.body.privilege), res.locals.user.privilege);
      // }
      const result = await this.organizerDataMapper.update(organizer);
      return this.sendResponse(res, new ResponseBody('Success', 200, result));
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }
}
