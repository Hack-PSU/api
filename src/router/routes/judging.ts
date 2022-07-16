import express, { NextFunction, Request, Response, Router } from 'express';
import { Inject, Injectable } from 'injection-js';
import { IProjectDataMapper } from '../../models/project/project-data-mapper-impl';
import { IExpressController, ResponseBody } from '..';
import { HttpError } from '../../JSCommon/errors';
import { Util } from '../../JSCommon/util';
import { IFirebaseAuthService } from '../../services/auth/auth-types';
import { AclOperations, IAclPerm } from '../../services/auth/RBAC/rbac-types';
import { Logger } from '../../services/logging/logging';
import { ParentRouter } from '../router-types';
import { Project } from '../../models/project/project';

@Injectable()
export class JudgingController extends ParentRouter implements IExpressController {

    protected static baseRoute = '/judging';

    public router: Router;

    constructor(
        @Inject('IAuthService') private readonly authService: IFirebaseAuthService,
        @Inject('BunyanLogger') private readonly logger: Logger,
        @Inject('IProjectDataMapper') public projectDataMapper: IProjectDataMapper,
        @Inject('IProjectDataMapper') public projectAclPerm: IAclPerm,
    ) {
        super();
        this.router = express.Router();
        this.routes(this.router);
    }

    // TODO: Add integration tests for all of these
    public routes(app: Router): void {
        app.use((req, res, next) => this.authService.authenticationMiddleware(req, res, next));
        app.get('/project', 
            this.authService.verifyAcl(this.projectAclPerm, AclOperations.READ),
            (req, res, next) => this.getProjectHandler(req, res, next),
        );
        app.get('/project/all',
            this.authService.verifyAcl(this.projectAclPerm, AclOperations.READ),
            (req, res, next) => this.getAllProjectsHandler(req, res, next),
        );
        app.post('/project',
            this.authService.verifyAcl(this.projectAclPerm, AclOperations.CREATE),
            (req, res, next) => this.insertProjectHandler(req, res, next),
        );
        app.post('/project/delete',
            this.authService.verifyAcl(this.projectAclPerm, AclOperations.DELETE),
            (req, res, next) => this.deleteProjectHandler(req, res, next),
        );
    }

    private async getProjectHandler(req: Request, res: Response, next: NextFunction) {
        if (!req.query.uid) {
            return next(new HttpError('Valid uid must be provided.', 400));
        }
        try {
            const result = await this.projectDataMapper.get(req.query.uid, req.query.opts);
            return this.sendResponse(res, new ResponseBody('Success', 200, result));
        } catch (error) {
            return Util.errorHandler500(error, next);
        }
    }

    private async getAllProjectsHandler(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await this.projectDataMapper.getAll(req.query.opts);
            return this.sendResponse(res, new ResponseBody('Success', 200, result));
        } catch (error) {
            return Util.errorHandler500(error, next);
        }
    }

    private async insertProjectHandler(req: Request, res: Response, next: NextFunction) {
        if (!req.body) {
            return next(new HttpError('Could not find request body', 400));
        }
        
        let project: Project;
        try {
            project = new Project(req.body);
        } catch (error) {
            return next(new HttpError('Some properties were not as expected.', 400));
        }

        try {
            const result = await this.projectDataMapper.insert(project);
            return this.sendResponse(res, new ResponseBody('Success', 200, result));
        } catch (error) {
            return Util.errorHandler500(error, next);
        }
    }

    private async deleteProjectHandler(req: Request, res: Response, next: NextFunction) {
        if (!req.body.uid || !parseInt(req.body.uid, 10)) {
            return next(new HttpError('Could not find valid uid.', 400));
        }
        try {
            const result = await this.projectDataMapper.deleteProject(req.body.uid);
            return this.sendResponse(res, new ResponseBody('Success', 200, result));
        } catch (error) {
            return Util.errorHandler500(error, next);
        }
    }
    

    // private async getExtraCreditClassesHandler(res: Response, next: NextFunction) {
    //     try {
    //       const result = await this.extraCreditDataMapper.getAllClasses({
    //         byHackathon: !res.locals.allHackathons,
    //         count: res.locals.limit,
    //         hackathon: res.locals.hackathon,
    //         startAt: res.locals.offset,
    //       });
    //       const response = new ResponseBody('Success', 200, result);
    //       return this.sendResponse(res, response);
    //     } catch (error) {
    //       return Util.errorHandler500(error, next);
    //     }
    //   }

}