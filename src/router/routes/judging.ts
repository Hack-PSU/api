import express, { NextFunction, Request, Response, Router } from 'express';
import { Inject, Injectable } from 'injection-js';
import * as path from 'path';
import { map } from 'rxjs/operators';
import { IExpressController, ResponseBody } from '..';
import { Constants } from '../../assets/constants/constants';
import { UidType } from '../../JSCommon/common-types';
import { HttpError } from '../../JSCommon/errors';
import { Util } from '../../JSCommon/util';
import { AuthLevel, IFirebaseAuthService } from '../../services/auth/auth-types';
import { AclOperations, IAclPerm } from '../../services/auth/RBAC/rbac-types';
import { Logger } from '../../services/logging/logging';
import { ParentRouter } from '../router-types';

@Injectable()
export class JudgingController extends ParentRouter implements IExpressController {

    protected static baseRoute = '/judging';

    public router: Router;

    constructor(
        @Inject('IAuthService') private readonly authService: IFirebaseAuthService,
        @Inject('BunyanLogger') private readonly logger: Logger,
    ) {
        super();
        this.router = express.Router();
        this.routes(this.router);
    }

    public routes(app: Router): void {
        // put any routes here
    }
}