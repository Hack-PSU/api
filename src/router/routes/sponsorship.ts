import express, { NextFunction, Request, Response, Router } from 'express';
import { Inject, Injectable } from 'injection-js';
import { IExpressController, ResponseBody } from '..';
import { HttpError } from '../../JSCommon/errors';
import { Environment, Util } from '../../JSCommon/util';
import { IFirebaseAuthService } from '../../services/auth/auth-types';
import { AclOperations, IAclPerm } from '../../services/auth/RBAC/rbac-types';
import { Logger } from '../../services/logging/logging';
import { WebsocketPusher } from '../../services/communication/websocket-pusher';
import { ParentRouter } from '../router-types';
import { ISponsorDataMapper } from '../../models/sponsorship/sponsor-data-mapper-impl';
import { Sponsor } from "../../models/sponsorship/sponsor";
import { IActiveHackathonDataMapper } from "../../models/hackathon/active-hackathon";


@Injectable()
export class SponsorshipController extends ParentRouter implements IExpressController {

  protected static baseRoute = '/sponsorship';

  public router: Router;

  constructor(
    @Inject('IAuthService') private readonly authService: IFirebaseAuthService,
    @Inject('BunyanLogger') private readonly logger: Logger,
    @Inject('WebsocketPusher') private readonly websocketPusher: WebsocketPusher,
    @Inject('ISponsorDataMapper') private readonly sponsorDataMapper: ISponsorDataMapper,
    @Inject('ISponsorDataMapper') private readonly sponsorAclPerm: IAclPerm,
    @Inject('IActiveHackathonDataMapper') protected readonly activeHackathonDataMapper: IActiveHackathonDataMapper,
  ) {
    super();
    this.router = express.Router();
    this.routes(this.router);
  }

  // TODO: Add integration tests for all of these
  public routes(app: Router): void {
    app.get(
      '/',
      (req, res, next) => this.getSponsorHandler(req, res, next),
    );
    app.get(
      '/all',
      (req, res, next) => this.getAllSponsorsHandler(req, res, next),
    );
    
    // all following routes require authentication
    app.use((req, res, next) => this.authService.authenticationMiddleware(req, res, next));
    app.post(
      '/',
      this.authService.verifyAcl(this.sponsorAclPerm, AclOperations.CREATE),
      (req, res, next) => this.insertSponsorHandler(req, res, next),
    );
    app.post(
      '/delete',
      this.authService.verifyAcl(this.sponsorAclPerm, AclOperations.DELETE),
      (req, res, next) => this.deleteSponsorHandler(req, res, next),
    );
    app.post(
      '/update',
      this.authService.verifyAcl(this.sponsorAclPerm, AclOperations.CREATE),
      (req, res, next) => this.updateSponsorHandler(req, res, next),
    );
    app.post(
      '/update/all',
      this.authService.verifyAcl(this.sponsorAclPerm, AclOperations.CREATE),
      (req, res, next) => this.updateAllSponsorsHandler(req, res, next),
    );
  }

  /**
   * @api {get} /sponsorship Get a sponsor by their uid
   * @apiVersion 2.0.0
   * @apiName Get Sponsor
   * @apiPermission UserPermission
   * @apiUse AuthArgumentRequired
   * @apiGroup Sponsorship
   * @apiParam {Number} uid The uid of this sponsor
   * @apiSuccess {Sponsor} data The requested sponsor
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */
  private async getSponsorHandler(req: Request, res: Response, next: NextFunction) {
    if (!req.query.uid) {
      return next(new HttpError('Valid sponsor uid must be provided.', 400));
    }
    try {
      const result = await this.sponsorDataMapper.get(req.query.uid, req.query);
      return this.sendResponse(res, new ResponseBody('Success', 200, result));
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * @api {post} /sponsorship Insert a sponsor
   * @apiVersion 2.0.0
   * @apiName Insert Sponsor
   * @apiPermission TeamMemberPermission
   * @apiUse AuthArgumentRequired
   * @apiGroup Sponsorship
   * @apiParam {String} name The sponsor's name
   * @apiParam {String} level The level of the sponsor
   * @apiParam {String} logo The link to the sponsor's logo
   * @apiParam {Number} order The sponsor's location in the display order
   * @apiParam {String} [websiteLink] The link to the sponsor's website
   * @apiParam {String} [hackathon] The uid of the hackathon for this sponsor
   * @apiSuccess {Sponsor} data The inserted sponsor
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */  
  private async insertSponsorHandler(req: Request, res: Response, next: NextFunction) {
    if (!req.body) {
      return next(new HttpError('Could not find request body', 400));
    }
  
    let sponsor: Sponsor;
    try {
      sponsor = new Sponsor(req.body);
    } catch (error) {
      return next(new HttpError('Some sponsor properties were not as expected.', 400));
    }

    // default to current hackathon
    if (!sponsor.hackathon) {
      sponsor.hackathon = (await this.activeHackathonDataMapper.activeHackathon.toPromise()).uid;
    }

    try {
      const result = await this.sponsorDataMapper.insert(sponsor);
      if (Util.getCurrentEnv() == Environment.PRODUCTION) {
        this.websocketPusher.sendUpdateRequest(
          WebsocketPusher.SPONSORSHIP,
          WebsocketPusher.MOBILE,
          req.headers.idtoken as string,
        );
      }
      return this.sendResponse(res, new ResponseBody('Success', 200, result));
    } catch (error) {
      return Util.errorHandler500(error, next);
    }    
  }

  /**
   * @api {get} /sponsorship/all Get all sponsors for a hackathon
   * @apiVersion 2.0.0
   * @apiPermission UserPermission
   * @apiUse AuthArgumentRequired
   * @apiName Get all Sponsors
   * @apiGroup Sponsorship
   * @apiSuccess {Sponsor[]} data The retrieved sponsors
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */
  private async getAllSponsorsHandler(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.sponsorDataMapper.getAll(req.query);
      return this.sendResponse(res, new ResponseBody('Success', 200, result));
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * @api {post} /sponsorship/update Update a Sponsor
   * @apiVersion 2.0.0
   * @apiName Update Sponsor
   * @apiPermission TeamMemberPermission
   * @apiUse AuthArgumentRequired
   * @apiGroup Sponsorship
   * @apiParam {Number} uid The sponsor's uid
   * @apiParam {String} name The sponsor's name
   * @apiParam {String} level The level of the sponsor
   * @apiParam {String} logo The link to the sponsor's logo
   * @apiParam {Number} order The sponsor's location in the display order
   * @apiParam {String} websiteLink The link to the sponsor's website
   * @apiParam {String} [hackathon] The uid of the hackathon for this sponsor
   * @apiSuccess {Sponsor} data The inserted sponsor
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */  
  private async updateSponsorHandler(req: Request, res: Response, next: NextFunction) {
    if (!req.body) {
      return next(new HttpError('Could not find request body', 400));
    }
    if (!req.body.uid) {
      return next(new HttpError('Could not find valid uid', 400));
    }
  
    let sponsor: Sponsor;
    try {
      sponsor = new Sponsor(req.body);
    } catch (error) {
      return next(new HttpError('Some sponsor properties were not as expected.', 400));
    }

    // default to current hackathon
    if (!sponsor.hackathon) {
      sponsor.hackathon = (await this.activeHackathonDataMapper.activeHackathon.toPromise()).uid;
    }

    try {
      const result = await this.sponsorDataMapper.update(sponsor);
      if (Util.getCurrentEnv() == Environment.PRODUCTION) {
        this.websocketPusher.sendUpdateRequest(
          WebsocketPusher.SPONSORSHIP,
          WebsocketPusher.MOBILE,
          req.headers.idtoken as string,
        );
      }
      return this.sendResponse(res, new ResponseBody('Success', 200, result));
    } catch (error) {
      return Util.errorHandler500(error, next);
    }    
  }

  /**
   * @api {post} /delete Delete a Sponsor
   * @apiVersion 2.0.0
   * @apiName Delete Sponsor
   * @apiUse AuthArgumentRequired
   * @apiPermission TeamMemberPermission
   * @apiGroup Sponsorship
   * @apiParam {Number} uid The sponsor's uid
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */   
  private async deleteSponsorHandler(req: Request, res: Response, next: NextFunction) {
    if (!req.body.uid || !(req.body.uid instanceof Number)) {
      return next(new HttpError('Could not find valid uid.', 400));
    }
    try {
      const result = await this.sponsorDataMapper.deleteSponsor(req.body.uid);
      if (Util.getCurrentEnv() == Environment.PRODUCTION) {
        this.websocketPusher.sendUpdateRequest(
          WebsocketPusher.SPONSORSHIP,
          WebsocketPusher.MOBILE,
          req.headers.idtoken as string,
        );
      }
      return this.sendResponse(res, new ResponseBody('Success', 200, result));
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * @api {post} /sponsorship/update/all Update the given Sponsors
   * @apiVersion 2.0.0
   * @apiName Update Sponsors
   * @apiPermission TeamMemberPermission
   * @apiUse AuthArgumentRequired
   * @apiGroup Sponsorship
   * @apiParam {Sponsor} sponsors The array of sponsors
   * @apiParam {Number} sponsor.uid The sponsor's uid
   * @apiParam {String} sponsor.name The sponsor's name
   * @apiParam {String} sponsor.level The level of the sponsor
   * @apiParam {String} sponsor.logo The link to the sponsor's logo
   * @apiParam {String} [sponsor.hackathon] The uid of the hackathon for this sponsor
   * @apiParam {String} [sponsor.websiteLink] The link to the sponsor's website
   * @apiParam {Number} sponsor.order The sponsor's position in the display order
   * @apiSuccess {Sponsor} data The inserted sponsor
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */
  private async updateAllSponsorsHandler(req: Request, res: Response, next: NextFunction) {
    if (!req.body) {
      return next(new HttpError('Could not find valid request body.', 400));
    }
    if (!req.body.sponsors) {
      return next(new HttpError('Could not find array of sponsors in request body.', 400));
    }
    let sponsors: Sponsor[] = [];
    try {
      req.body.sponsors.forEach(element => {
        const sponsor = new Sponsor(element);
        sponsors.push(sponsor.dbRepresentation);
      });
    } catch (error) {
      return next(new HttpError('Some properties were not as expected when creating sponsors.', 400));
    }

    try {
      const result = await this.sponsorDataMapper.updateAll(sponsors);
      if (Util.getCurrentEnv() == Environment.PRODUCTION) {
        this.websocketPusher.sendUpdateRequest(
          WebsocketPusher.SPONSORSHIP,
          WebsocketPusher.MOBILE,
          req.headers.idtoken as string,
        );
      }
      return this.sendResponse(res, new ResponseBody('Success', 200, result));
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }
}