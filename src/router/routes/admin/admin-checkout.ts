import { NextFunction, Request, Response, Router } from 'express';
import { Inject, Injectable } from 'injection-js';
import { IExpressController, ResponseBody } from '../..';
import { HttpError } from '../../../JSCommon/errors';
import { Util } from '../../../JSCommon/util';
import { ICheckoutItemsDataMapper } from '../../../models/checkout-items';
import { CheckoutItems } from '../../../models/checkout-items/checkout-items';
import { ICheckoutObjectDataMapper } from '../../../models/checkout-object';
import { CheckoutObject } from '../../../models/checkout-object/checkout-object';
import { IActiveHackathonDataMapper } from '../../../models/hackathon/active-hackathon';
import { IRegisterDataMapper } from '../../../models/register';
import { IScannerDataMapper } from '../../../models/scanner';
import { IApikeyAuthService, IFirebaseAuthService } from '../../../services/auth/auth-types';
import { AclOperations, IAclPerm } from '../../../services/auth/RBAC/rbac-types';
import { AbstractScannerController } from '../scanner/scanner-controller-abstract';

@Injectable()
export class AdminCheckoutController extends AbstractScannerController implements IExpressController {
  public router: Router;

  constructor(
    @Inject('IAuthService') authService: IFirebaseAuthService,
    @Inject('IScannerAuthService') scannerAuthService: IApikeyAuthService,
    @Inject('ICheckoutObjectDataMapper') scannerAcl: IAclPerm,
    @Inject('IScannerDataMapper') scannerDataMapper: IScannerDataMapper,
    @Inject('IRegisterDataMapper') registerDataMapper: IRegisterDataMapper,
    @Inject('IActiveHackathonDataMapper') activeHackathonDataMapper: IActiveHackathonDataMapper,
    @Inject('ICheckoutObjectDataMapper') private readonly checkoutObjectDataMapper: ICheckoutObjectDataMapper,
    @Inject('ICheckoutItemsDataMapper') private readonly checkoutItemsDataMapper: ICheckoutItemsDataMapper,
    @Inject('ICheckoutItemsDataMapper') private readonly checkoutItemsAcl: IAclPerm,
  ) {
    super(
      authService,
      scannerAuthService,
      scannerAcl,
      scannerDataMapper,
      registerDataMapper,
      activeHackathonDataMapper,
    );
    this.router = Router();
    this.routes(this.router);
  }

  public routes(app: Router): void {
    // Get all checked out items
    app.get(
      '/',
      this.authService.verifyAcl(this.scannerAcl, AclOperations.READ_ALL),
      (req, res, next) => this.getAllCheckoutObjectHandler(res, next),
    );
    // Get all items that can be checked out
    app.get(
      '/items',
      this.authService.verifyAcl(this.checkoutItemsAcl, AclOperations.READ_ALL),
      (req, res, next) => this.getAllCheckoutItemsHandler(res, next),
    );
    // Create a new checkout request
    app.post(
      '/',
      (req, res, next) => this.verifyScannerPermissionsMiddleware(
        req,
        res,
        next,
        AclOperations.CREATE,
      ),
      (req, res, next) => this.getUserByRfidBand(req, res, next),
      (req, res, next) => this.createCheckoutRequestHandler(req, res, next),
    );
    // Return a checked out item
    app.post(
      '/return',
      (req, res, next) => this.verifyScannerPermissionsMiddleware(
        req,
        res,
        next,
        AclOperations.UPDATE,
      ),
      (req, res, next) => this.returnObjectHandler(req, res, next),
    );
    // Create a checkout item
    app.post(
      '/items',
      this.authService.verifyAcl(this.checkoutItemsAcl, AclOperations.CREATE),
      (req, res, next) => this.addCheckoutItemsHandler(req, res, next),
    );
    // Get all available checkout items
    app.get(
      '/items/availability',
      (req, res, next) => this.verifyScannerPermissionsMiddleware(
        req,
        res,
        next,
        AclOperations.READ_ALL,
      ),
      (req, res, next) => this.getAllAvailableCheckoutItemsHandler(res, next),
    );
  }

  /**
   * @api {post} /admin/checkout Create a new checkout request
   * @apiVersion 2.0.0
   * @apiName Create new Item Checkout
   * @apiGroup Item Checkout
   * @apiParam {String} itemId The id of the item being checked out
   * @apiParam {String} [userId] The uid of the user checking out the item
   * @apiUse WristbandIdParam
   * @apiDescription This route allows an admin or a scanner to create a new checkout
   * request.
   * NOTE: One of userId or wid must be provided for this route to work
   * @apiUse AuthArgumentRequired
   * @apiPermission TeamMemberPermission
   * @apiSuccess {CheckoutObject} The inserted checkout object
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */
  private async createCheckoutRequestHandler(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    // Validate incoming request
    if (!req.body) {
      return Util.standardErrorHandler(new HttpError('Illegal request format', 400), next);
    }
    if (!req.body.itemId) {
      return Util.standardErrorHandler(
        new HttpError('Cannot find item ID to checkout', 400),
        next,
      );
    }

    if (!req.body.userId && !res.locals.registration.id && !res.locals.userToken.uid) {
      return Util.standardErrorHandler(
        new HttpError('Could not retrieve user ID from provided information', 400),
        next,
      );
    }

    try {
      const checkoutObject = new CheckoutObject({
        checkout_time: req.body.checkoutTime || Date.now(),
        item_id: req.body.itemId,
        user_id: req.body.userId || res.locals.registration.id || res.locals.userToken.uid,
      });
      const result = await this.checkoutObjectDataMapper.insert(checkoutObject);
      const response = new ResponseBody(
        'Success',
        200,
        result,
      );
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.standardErrorHandler(error, next);
    }
  }

  /**
   * @api {post} /admin/checkout/return Return a checked out item
   * @apiVersion 2.0.0
   * @apiName Return checkout item
   * @apiGroup Item Checkout
   * @apiParam {String} checkoutId The id of the checkout instance
   * @apiParam {number} returnTime=now Epoch time for when the object was returned
   * @apiUse AuthArgumentRequired
   * @apiPermission TeamMemberPermission
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */
  private async returnObjectHandler(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    // Validate incoming request
    if (!req.body) {
      return Util.standardErrorHandler(new HttpError('Illegal request format', 400), next);
    }
    if (!req.body.checkoutId) {
      return Util.standardErrorHandler(
        new HttpError('Cannot find item ID to checkout', 400),
        next,
      );
    }
    if (!req.body.returnTime) {
      req.body.returnTime = Date.now();
    }

    try {
      const result = await this.checkoutObjectDataMapper.returnItem(
        req.body.returnTime,
        req.body.checkoutId,
      );
      const response = new ResponseBody(
        'Success',
        200,
        result,
      );
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.standardErrorHandler(error, next);
    }
  }

  /**
   * @api {get} /admin/checkout/ Get all checked out items
   * @apiVersion 2.0.0
   * @apiName Get list of checkout out items
   * @apiGroup Item Checkout
   * @apiUse AuthArgumentRequired
   * @apiPermission TeamMemberPermission
   * @apiSuccess {CheckoutObject[]} All Checkout instances
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */
  private async getAllCheckoutObjectHandler(
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await this.checkoutObjectDataMapper.getAll({
        byHackathon: !res.locals.allHackathons,
        count: res.locals.limit,
        hackathon: res.locals.hackathon,
        startAt: res.locals.offset,
        ignoreCache: res.locals.ignoreCache,
      });
      const response = new ResponseBody('Success', 200, result);
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * @api {get} /admin/checkout/items Get all items available for checkout
   * @apiVersion 2.0.0
   * @apiName Get items for checkout
   * @apiGroup Item Checkout
   * @apiUse AuthArgumentRequired
   * @apiPermission TeamMemberPermission
   * @apiSuccess {CheckoutItem[]} All items in inventory for checkout
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */
  private async getAllCheckoutItemsHandler(
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await this.checkoutItemsDataMapper.getAll({
        count: res.locals.limit,
        startAt: res.locals.offset,
        ignoreCache: res.locals.ignoreCache,
      });
      const response = new ResponseBody('Success', 200, result);
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

 /**
  * @api {post} /admin/checkout/items Add new item for checkout
  * @apiVersion 2.0.0
  * @apiName Add new item for checkout
  * @apiGroup Item Checkout
  * @apiParam {String} name Name of the item
  * @apiParam {Number} quantity Quantity of items available
  * @apiUse AuthArgumentRequired
  * @apiPermission DirectorPermission
  * @apiSuccess {CheckoutItem} The added item
  * @apiUse IllegalArgumentError
  * @apiUse ResponseBodyDescription
  */
  private async addCheckoutItemsHandler(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    // Validate incoming request
    if (!req.body) {
      return Util.standardErrorHandler(new HttpError('Illegal request format', 400), next);
    }
    if (!req.body.name) {
      return Util.standardErrorHandler(
        new HttpError('No name provided', 400),
        next,
      );
    }
    if (!req.body.quantity) {
      return Util.standardErrorHandler(
        new HttpError('No quantity provided', 400),
        next,
      );
    }

    try {
      const checkoutItems = new CheckoutItems({
        name: req.body.name,
        quantity: req.body.quantity,
      });
      const result = await this.checkoutItemsDataMapper.insert(checkoutItems);
      const response = new ResponseBody(
        'Success',
        200,
        result,
      );
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.standardErrorHandler(error, next);
    }
  }

  /**
   * @api {get} /admin/checkout/items Get all items available for checkout
   * @apiVersion 2.0.0
   * @apiName Get items for checkout
   * @apiGroup Item Checkout
   * @apiUse AuthArgumentRequired
   * @apiPermission TeamMemberPermission
   * @apiSuccess {CheckoutItem[]} All available items in inventory for checkout
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */
  private async getAllAvailableCheckoutItemsHandler(
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await this.checkoutItemsDataMapper.getAllAvailable();
      const response = new ResponseBody('Success', 200, result);
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }
}
