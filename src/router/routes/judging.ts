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
import { Score } from '../../models/score/score';
import { IScoreDataMapper } from 'models/score/score-data-mapper';

@Injectable()
export class JudgingController extends ParentRouter implements IExpressController {

    protected static baseRoute = '/judging';

    public router: Router;

    constructor(
        @Inject('IAuthService') private readonly authService: IFirebaseAuthService,
        @Inject('BunyanLogger') private readonly logger: Logger,
        @Inject('IProjectDataMapper') private readonly projectDataMapper: IProjectDataMapper,
        @Inject('IProjectDataMapper') private readonly projectAclPerm: IAclPerm,
        @Inject('IScoreDataMapper') private readonly scoreDataMapper: IScoreDataMapper,
        @Inject('IScoreDataMapper') private readonly scoreAclPerm: IAclPerm,
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
        app.post('/score',
            this.authService.verifyAcl(this.scoreAclPerm, AclOperations.CREATE),
            (req, res, next) => this.insertScoreHandler(req, res, next),
        );
        app.get('/score/all',
            this.authService.verifyAcl(this.scoreAclPerm, AclOperations.READ),
            (req, res, next) => this.getAllScoresHandler(req, res, next),
        );
        app.post('/assignments',
            this.authService.verifyAcl(this.scoreAclPerm, AclOperations.CREATE),
            (req, res, next) => this.generateAssignmentshandler(req, res, next),
        );
    }

    /**
    * @api {get} /judging/project Get a Project
    * @apiVersion 2.0.0
    * @apiName Get Project
    * @apiGroup Judging
    * @apiParam {Number} uid The project's uid
    * @apiSuccess {Project} data The requested project
    * @apiUse IllegalArgumentError
    * @apiUse ResponseBodyDescription
    */   
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

    /**
    * @api {get} /judging/project/all Get all Projects
    * @apiVersion 2.0.0
    * @apiName Get All Projects
    * @apiPermission DirectorPermission
    * @apiUse AuthArgumentRequired
    * @apiGroup Judging
    * @apiSuccess {Project[]} data An array of projects
    * @apiUse IllegalArgumentError
    * @apiUse ResponseBodyDescription
    */   
    private async getAllProjectsHandler(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await this.projectDataMapper.getAll(req.query.opts);
            return this.sendResponse(res, new ResponseBody('Success', 200, result));
        } catch (error) {
            return Util.errorHandler500(error, next);
        }
    }

    /**
    * @api {post} /judging/project Insert a Project
    * @apiVersion 2.0.0
    * @apiName Insert Project
    * @apiPermission DirectorPermission
    * @apiUse AuthArgumentRequired
    * @apiGroup Judging
    * @apiParam {String} project The project's name
    * @apiSuccess {Project} data The inserted project
    * @apiUse IllegalArgumentError
    * @apiUse ResponseBodyDescription
    */
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

    /**
    * @api {post} /judging/project/delete Delete a Project
    * @apiVersion 2.0.0
    * @apiName Delete Project
    * @apiUse AuthArgumentRequired
    * @apiPermission DirectorPermission
    * @apiGroup Judging
    * @apiParam {Number} uid The project's uid
    * @apiUse IllegalArgumentError
    * @apiUse ResponseBodyDescription
    */   
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

    /**
    * @api {post} /judging/score Insert a Scoring
    * @apiVersion 2.0.0
    * @apiName Insert Scoring
    * @apiPermission TeamMemberPermission
    * @apiUse AuthArgumentRequired
    * @apiGroup Judging
    * @apiParam {Number} project_id The project's uid
    * @apiParam {String} judge The email of the judge
    * @apiParam {Number} creativity Score for the 'Creativity' category
    * @apiParam {Number} technical Score for the 'Technical' category
    * @apiParam {Number} implementation Score for the 'Implementation' category
    * @apiParam {Number} clarity Score for the 'Clarity' category
    * @apiParam {Number} growth Score for the 'Growth' category
    * @apiParam {Number} [humanitarian] Score for the 'Humanitarian' award
    * @apiParam {Number} [supply_chain] Score for the 'Supply Chain' award
    * @apiParam {Number} [environmental] Score for the 'environmental' award
    * @apiSuccess {Score} data The inserted score
    * @apiUse IllegalArgumentError
    * @apiUse ResponseBodyDescription
    */
    private async insertScoreHandler(req: Request, res: Response, next: NextFunction) {
        if (!req.body) {
            return next(new HttpError('Could not find request body', 400));
        }
        
        let score: Score;
        try {
            score = new Score(req.body);
        } catch (error) {
            return next(new HttpError('Some properties were not as expected.', 400));
        }

        try {
            const result = await this.scoreDataMapper.insert(score);
            return this.sendResponse(res, new ResponseBody('Success', 200, result));
        } catch (error) {
            return Util.errorHandler500(error, next);
        }
    }

   /**
    * @api {get} /judging/score/all Get all Submitted Scores
    * @apiVersion 2.0.0
    * @apiPermission DirectorPermission
    * @apiUse AuthArgumentRequired
    * @apiName Get all Scores
    * @apiGroup Judging
    * @apiSuccess {Score[]} data The retrieved scores
    * @apiUse IllegalArgumentError
    * @apiUse ResponseBodyDescription
    */
    private async getAllScoresHandler(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await this.scoreDataMapper.getAll(req.query.opts);
            return this.sendResponse(res, new ResponseBody('Success', 200, result));
        } catch (error) {
            return Util.errorHandler500(error, next);
        }
    }

    /**
     * @api {post} /judging/assignments Generate Assignments for Given Users
     * @apiVersion 2.0.0
     * @apiPermission DirectorPermission
     * @apiUse AuthArgumentRequired
     * @apiName Generate Judging Assignments
     * @apiGroup Judging
     * @apiParam {String[]} emails A list of organizer emails to generate assignments for
     * @apiParam {Number} projectsPerOrganizer How many judging assignment each organizer should receive
     * @apiUse IllegalArgumentError
     * @apiUse ResponseBodyDescription
     */
    private async generateAssignmentshandler(req: Request, res: Response, next: NextFunction) {
        if (!req.body) {
            return next(new HttpError('Could not find request body.', 400));
        }
        if (!req.body.emails) {
            return next(new HttpError('Could not find emails in request body.', 400));
        }
        if (!req.body.emails[0]) {
            return next(new HttpError('Emails field in request body was not an array.', 400));
        }
        if (!req.body.projectsPerOrganizer || !parseInt(req.body.projectsPerOrganizer, 10)) {
            return next(new HttpError('Could not find an integer for projectsPerOrganizer', 400));
        }
        try {
            const result = await this.scoreDataMapper.generateAssignments(req.body.getMaxListeners, req.body.projectsPerOrganizer);
            return this.sendResponse(res, new ResponseBody('Success', 200, result));    
        } catch (error) {
            return Util.errorHandler500(error, next);
        }
    }
}