import { validate } from 'email-validator';
import express, { NextFunction, Request, Response, Router } from 'express';
import { Inject, Injectable } from 'injection-js';
import { map } from 'rxjs/operators';
import { IExpressController, ResponseBody } from '..';
import { UidType } from '../../JSCommon/common-types';
import { HttpError } from '../../JSCommon/errors';
import { Util } from '../../JSCommon/util';
import { IExtraCreditDataMapper } from '../../models/extra-credit';
import { ExtraCreditAssignment } from '../../models/extra-credit/extra-credit-assignment';
import { IActiveHackathonDataMapper } from '../../models/hackathon/active-hackathon';
import { IRegisterDataMapper } from '../../models/register';
import { PreRegistration } from '../../models/register/pre-registration';
import { Registration } from '../../models/register/registration';
import { IPreregistrationProcessor } from '../../processors/pre-registration-processor';
import { IRegistrationProcessor } from '../../processors/registration-processor';
import { IFirebaseAuthService } from '../../services/auth/auth-types';
import { AclOperations, IAclPerm } from '../../services/auth/RBAC/rbac-types';
import { Logger } from '../../services/logging/logging';
import { IStorageService } from '../../services/storage';
import { ParentRouter } from '../router-types';

@Injectable()
export class UsersController extends ParentRouter implements IExpressController {

  protected static baseRoute = '/users';

  public router: Router;
  constructor(
    @Inject('IAuthService') private readonly authService: IFirebaseAuthService,
    @Inject('IRegisterDataMapper') private readonly aclPerm: IAclPerm,
    @Inject('IExtraCreditDataMapper') private readonly extraCreditPerm: IAclPerm,
    @Inject('IRegistrationProcessor') private readonly registrationProcessor: IRegistrationProcessor,
    @Inject('IPreregistrationProcessor') private readonly preregistrationProcessor: IPreregistrationProcessor,
    @Inject('IRegisterDataMapper') private readonly registerDataMapper: IRegisterDataMapper,
    @Inject('IExtraCreditDataMapper') private readonly extraCreditDataMapper: IExtraCreditDataMapper,
    @Inject('IActiveHackathonDataMapper') private readonly activeHackathonDataMapper: IActiveHackathonDataMapper,
    @Inject('IStorageService') private readonly storageService: IStorageService,
    @Inject('BunyanLogger') private readonly logger: Logger,
  ) {
    super();
    this.router = express.Router();
    this.routes(this.router);
  }

  public routes(app: Router): void {
    // Unauthenticated routes
    app.post('/pre-register', (req, res, next) => this.preRegistrationHandler(req, res, next));
    // Use authentication
    app.use((req, res, next) => this.authService.authenticationMiddleware(req, res, next));
    // Authenticated routes
    app
      .post(
        '/register',
        this.authService.verifyAcl(this.aclPerm, AclOperations.CREATE),
        (req, res, next) => this.storageService.upload(req, res, next),
        (req, res, next) => this.registrationHandler(req, res, next),
      );
    app.get(
      '/register',
      this.authService.verifyAcl(this.aclPerm, AclOperations.READ),
      (req, res, next) => this.getAllRegistrations(res, next),
    );
    app.get(
      '/extra-credit',
      this.authService.verifyAcl(this.extraCreditPerm, AclOperations.READ_ALL_CLASSES),
      (req, res, next) => this.getExtraCreditClassesHandler(res, next),
    );
    app.post(
      '/extra-credit',
      this.authService.verifyAcl(this.extraCreditPerm, AclOperations.CREATE),
      (req, res, next) => this.addExtraCreditAssignmentHandler(req, res, next),
    );
  }

  private async generateFileName(uid: UidType, firstName: string, lastName: string) {
    return `${uid}-${firstName}-${lastName}-${await this.activeHackathonDataMapper.activeHackathon.pipe(
      map(hackathon => hackathon.uid)).toPromise()}.pdf`;
  }

  private validateRegistrationFields(registration: any) {
    if (!registration) {
      this.logger.error('No registration provided');
      throw new HttpError('No registration provided', 400);
    }
    if (!validate(registration.email)) {
      this.logger.error('IEmail used for registration is invalid');
      throw new HttpError('IEmail used for registration is invalid', 400);
    }
    if (!registration.eighteenBeforeEvent) {
      this.logger.error('User must be over eighteen years of age to register');
      throw new HttpError('User must be over eighteen years of age to register', 400);
    }
    if (!registration.mlhcoc) {
      this.logger.error('User must agree to MLH Code of Conduct');
      throw new HttpError('User must agree to MLH Code of Conduct', 400);
    }
    if (!registration.mlhdcp) {
      this.logger.error('User must agree to MLH data collection policy');
      throw new HttpError('User must agree to MLH data collection policy', 400);
    }
  }

  /**
   * @api {post} /users/pre-register Preregister for HackPSU
   * @apiVersion 2.0.0
   * @apiName Add Pre-Registration
   * @apiGroup User
   * @apiParam {String} email The email ID to register with
   * @apiSuccess {PreRegistration} The inserted pre registration
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */
  private async preRegistrationHandler(request: Request, response: Response, next: NextFunction) {
    if (!request.body ||
      !request.body.email ||
      !validate(request.body.email)) {
      return next(new HttpError('Valid email must be provided', 400));
    }
    let preRegistration: PreRegistration;
    try {
      preRegistration = new PreRegistration(request.body.email);
    } catch (error) {
      return Util.standardErrorHandler(
        new HttpError('Some properties were not as expected', 400),
        next,
      );
    }
    try {
      const res = await this.preregistrationProcessor.processPreregistration(preRegistration);
      return this.sendResponse(response, res);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * @api {post} /users/register/ Register for HackPSU
   * @apiVersion 2.0.0
   * @apiName Add Registration
   * @apiGroup User
   * @apiPermission UserPermission
   * @apiUse AuthArgumentRequired
   * @apiParam {String} firstName First name of the user
   * @apiParam {String} lastName Last name of the user
   * @apiParam {String} gender Gender of the user
   * @apiParam {enum} shirtSize [XS, S, M, L, XL, XXL]
   * @apiParam {String} [dietaryRestriction] The dietary restictions for the user
   * @apiParam {String} [allergies] Any allergies the user might have
   * @apiParam {boolean} travelReimbursement=false
   * @apiParam {boolean} firstHackathon=false Is this the user's first hackathon
   * @apiParam {String} university The university that the user attends
   * @apiParam {String} email The user's school email
   * @apiParam {String} academicYear The user's current year in school
   * @apiParam {String} major Intended or current major
   * @apiParam {String} phone The user's phone number (For MLH)
   * @apiParam {FILE} [resume] The resume file for the user (Max size: 10 MB)
   * @apiParam {String} [ethnicity] The user's ethnicity
   * @apiParam {String} codingExperience The coding experience that the user has
   * @apiParam {String} uid The UID from their Firebase account
   * @apiParam {boolean} eighteenBeforeEvent=true Will the person be eighteen before the event
   * @apiParam {boolean} mlhcoc=true Does the user agree to the mlhcoc?
   * @apiParam {boolean} mlhdcp=true Does the user agree to the mlh dcp?
   * @apiParam {String} referral Where did the user hear about the Hackathon?
   * @apiParam {String} project A project description that the user is proud of
   * @apiParam {String} expectations What the user expects to get from the hackathon
   * @apiParam {String} veteran=false Is the user a veteran?
   *
   * @apiSuccess {Registration} The inserted registration
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */
  private async registrationHandler(request: Request, response: Response, next: NextFunction) {
    // Validate incoming registration
    try {
      this.registrationProcessor.normaliseRegistrationData(request.body);
      request.body.uid = response.locals.user.uid;
      request.body.email = response.locals.user.email;
      this.validateRegistrationFields(request.body);
    } catch (error) {
      return Util.standardErrorHandler(
        new HttpError(error.toString(), 400),
        next,
      );
    }

    // Save registration
    if (request.file) {
      request.body.resume = this.storageService.uploadedFileUrl(
        await this.generateFileName(
          request.body.uid,
          request.body.firstName,
          request.body.lastName,
        ),
      );
    }

    let registration: Registration;
    try {
      registration = new Registration(request.body);
    } catch (error) {
      return Util.standardErrorHandler(
        new HttpError('Some properties were not as expected', 400),
        next,
      );
    }
    try {
      const res = await this.registrationProcessor.processRegistration(registration);
      return this.sendResponse(response, res);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * @api {get} /users/extra-credit Get all extra credit classes
   * @apiVersion 2.0.0
   * @apiName Get Extra Credit Classes
   * @apiGroup User
   * @apiPermission UserPermission
   *
   * @apiUse AuthArgumentRequired
   *
   * @apiSuccess {ExtraCreditClasses[]} Array of extra credit classes
   * @apiUse ResponseBodyDescription
   * @apiUse RequestOpts
   */
  private async getExtraCreditClassesHandler(res: Response, next: NextFunction) {
    try {
      const result = await this.extraCreditDataMapper.getAllClasses({
        byHackathon: !res.locals.allHackathons,
        count: res.locals.limit,
        hackathon: res.locals.hackathon,
        startAt: res.locals.offset,
      });
      const response = new ResponseBody('Success', 200, result);
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * @api {get} /users/register Get all registrations by a user
   * @apiVersion 2.0.0
   * @apiName Get registrations by user
   * @apiGroup User
   * @apiPermission UserPermission
   *
   * @apiUse AuthArgumentRequired
   *
   * @apiSuccess {ExtraCreditClasses[]} Array of extra credit classes
   * @apiUse ResponseBodyDescription
   * @apiUse RequestOpts
   */
  private async getAllRegistrations(res: Response, next: NextFunction) {
    try {
      const response = await this.registrationProcessor.getAllRegistrationsByUser(res.locals.user.uid);
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * @api {post} /users/extra-credit Track an extra credit class
   * @apiName Assign Extra Credit
   * @apiVersion 2.0.0
   * @apiGroup User
   * @apiPermission UserPermission
   *
   * @apiParam {String} cid - the id associated with the class
   * @apiUse AuthArgumentRequired
   * @apiSuccess {ExtraCreditAssignment} The inserted extra credit assignment
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
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

    if (!req.body.cid || !parseInt(req.body.cid, 10)) {
      return Util.standardErrorHandler(new HttpError('Could not find valid class id', 400), next);
    }
    req.body.uid = res.locals.user.uid;

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
