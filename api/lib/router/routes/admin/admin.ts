import ajv, { ErrorObject } from 'ajv';
import { validate } from 'email-validator';
import { NextFunction, Request, Response, Router } from 'express';
import { Inject, Injectable } from 'injection-js';
import { IExpressController, ResponseBody } from '../..';
import loadSchemas from '../../../assets/schemas/load-schemas';
import { HttpError } from '../../../JSCommon/errors';
import { Util } from '../../../JSCommon/util';
import { IAdminDataMapper } from '../../../models/admin';
import { ExtraCreditAssignment } from '../../../models/extra-credit/extra-credit-assignment';
import { IAuthService } from '../../../services/auth/auth-types';
import { AclOperations, IAclPerm, IAdminAclPerm } from '../../../services/auth/RBAC/rbac-types';
import { IDataMapper } from '../../../services/database';
import { ParentRouter } from '../../router-types';

const emailObjectSchema = loadSchemas('emailObjectSchema');

@Injectable()
export class AdminController extends ParentRouter implements IExpressController {
  protected static baseRoute = 'admin/';

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
    response.locals.allHackathons = !!request.query.allHackathons;
    return next();
  }

  private static validateEmails(emails: any[]): { goodEmails: any[]; badEmails: any[] } {
    // Run validation
    const validator = new ajv({ allErrors: true });
    const validateFunction = validator.compile(emailObjectSchema);
    const goodEmails: any[] = [];
    const badEmails: any[] = [];
    emails.map((emailObject) => {
      if (validate(emailObject)) {
        goodEmails.push(emailObject);
      } else {
        badEmails.push({
          ...emailObject,
          error: validator.errorsText(validateFunction.errors as ErrorObject[]),
        });
      }
      return true;
    });
    return { goodEmails, badEmails };
  }

  public router: Router;

  constructor(
    @Inject('IAuthService') private readonly authService: IAuthService,
    @Inject('IAdminDataMapper') private readonly adminDataMapper: IAdminDataMapper,
    @Inject('IAdminDataMapper') private readonly adminAcl: IAdminAclPerm,
    @Inject('IExtraCreditDataMapper') private readonly extraCreditDataMapper: IDataMapper<ExtraCreditAssignment>,
    @Inject('IExtraCreditDataMapper') private readonly extraCreditAcl: IAclPerm,
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
    app.use((req, res, next) => this.authService.authenticationMiddleware(req, res, next));
    app.use((req, res, next) => AdminController.parseCommonRequestFields(req, res, next));
    // AdminController.registerRouter('checkout', 'CheckoutController');
    AdminController.registerRouter('register', 'AdminRegisterController');
    AdminController.registerRouter('data', 'AdminStatisticsController');
    AdminController.registerRouter('hackathon', 'AdminHackathonController');
    // AdminController.registerRouter('location', 'AdminLocationController');
    app.get('/', (req, res) => this.mainHandler(res));
    app.get(
      '/userid',
      this.authService.verifyAcl(this.adminAcl, AclOperations.GET_EMAIL),
      (req, res, next) => this.getUserIdHandler(req, res, next),
    );
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
      '/extra_credit',
      this.authService.verifyAcl(this.extraCreditAcl, AclOperations.CREATE),
      (req, res, next) => this.addExtraCreditAssignmentHandler(req, res, next),
    );
  }

  /**
   * @api {get} /admin/ Get Authentication Status
   * @apiVersion 1.0.0
   * @apiName Get Authentication Status
   * @apiGroup Admin
   * @apiPermission TeamMemberPermission
   *
   * @apiUse AuthArgumentRequired
   *
   * @apiSuccess {String} Authorized admin
   */
  private mainHandler(res: Response) {
    const r = new ResponseBody('Authorized admin', 200, { result: 'success', data: {} });
    return this.sendResponse(res, r);
  }

  /**
   * @api {get} /admin/userid Get the uid corresponding to an email
   * @apiVersion 1.0.0
   * @apiName Get User Id
   * @apiGroup Admin
   * @apiPermission DirectorPermission
   *
   * @apiUse AuthArgumentRequired
   * @apiParam {string} email The email to query user id by
   * @apiSuccess {object} Object {uid, displayName}
   * @apiUse IllegalArgumentError
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
   * @apiVersion 1.0.0
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
      return Util.standardErrorHandler(
        new HttpError('Could not find email data to send', 400),
        next,
      );
    }
    if (!req.body.html || typeof req.body.html !== 'string') {
      return Util.standardErrorHandler(
        new HttpError('Could not find email content to send', 400),
        next,
      );
    }
    if (!req.body.subject) {
      return Util.standardErrorHandler(
        new HttpError('Could not find email subject to send', 400),
        next,
      );
    }
    const { goodEmails, badEmails } = AdminController.validateEmails(req.body.emails);

    if (goodEmails.length === 0) {
      // Respond with error immediately
      return Util.standardErrorHandler(
        new HttpError(
          'Emails could not be parsed properly',
          400,
        ),
        next,
      );
    }
    // Send the good emails
    try {
      const { successfulEmails, failedEmails } = await this.adminDataMapper.sendEmails(
        goodEmails,
        req.body.html,
        req.body.subject,
        req.body.fromEmail,
        res.locals.user.uid,
      );
      const totalFailures = badEmails.concat(failedEmails);
      // If all failed, respond accordingly
      if (successfulEmails.length === 0) {
        return Util.errorHandler500(
          new HttpError(
            { failures: totalFailures, text: 'Could not send emails' },
            500,
          ),
          next,
        );
      }

      await this.adminDataMapper.addEmailHistory(successfulEmails, totalFailures);
      if (totalFailures.length !== 0) {
        return this.sendResponse(
          res,
          new ResponseBody(
            'Some emails failed to send',
            207,
            { result: 'partial success', data: { successfulEmails, totalFailures } },
          ),
        );
      }
      return this.sendResponse(
        res,
        new ResponseBody(
          'Successfully sent all emails',
          200,
          { result: 'success', data: successfulEmails },
        ),
      );
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * @api {post} /admin/makeadmin Change a user's privileges
   * @apiVersion 1.0.0
   * @apiName Elevate user
   *
   * @apiGroup Admin
   * @apiPermission DirectorPermission
   *
   * @apiUse AuthArgumentRequired
   * @apiParam {String} uid The UID or email of the user to change admin privileges
   * @apiParam {Number} privilege The privilege level to set to {1: Volunteer, 2: Team Member, 3: Exec, 4: Tech-Exec, 5: Finance Director}
   * @apiSuccess {String} Success
   * @apiUse IllegalArgumentError
   */
  private async makeAdminHandler(req: Request, res: Response, next: NextFunction) {
    if (!req.body || !req.body.uid) {
      return Util.standardErrorHandler(
        new HttpError('Uid of new admin required', 400),
        next,
      );
    }
    if (!req.body || !req.body.privilege) {
      return Util.standardErrorHandler(
        new HttpError('New privilege level required', 400),
        next,
      );
    }
    try {
      const result = await this.adminDataMapper.modifyPermissions(
        req.body.uid,
        parseInt(req.body.privilege, 10),
        res.locals.privilege,
      );
      return this.sendResponse(
        res,
        new ResponseBody(
          'Successfully changed the status',
          200,
          result,
        ),
      );
    } catch (error) {
      return Util.standardErrorHandler(error, next);
    }
  }

  /**
   * @api {post} /admin/extra_credit setting user with the class they are receiving extra credit
   * @apiName Assign Extra Credit
   * @apiVersion 1.0.0
   * @apiGroup Admin
   * @apiPermission DirectorPermission
   *
   * @apiParam {String} uid - the id associated with the student
   * @apiParam {String} cid - the id associated with the class
   * @apiUse AuthArgumentRequired
   * @apiSuccess {String} Success
   * @apiUse IllegalArgumentError
   */
  private async addExtraCreditAssignmentHandler(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    // Validate incoming request
    if (!req.body) {
      return Util.standardErrorHandler(new HttpError('Illegal request format', 400), next);
    }

    if (!req.body.uid) {
      return Util.standardErrorHandler(new HttpError('Could not find hacker uid', 400), next);
    }

    if (!req.body.cid || !parseInt(req.body.cid, 10)) {
      return Util.standardErrorHandler(new HttpError('Could not find valid class id', 400), next);
    }

    try {
      const ecAssignment = new ExtraCreditAssignment(req.body);
      const result = await this.extraCreditDataMapper.insert(ecAssignment);
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
}
