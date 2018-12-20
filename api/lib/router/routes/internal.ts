import express, { NextFunction, Response, Request } from 'express';
import { IExpressController } from '..';
import { App } from '../../app';
import { HttpError } from '../../JSCommon/errors';
import { ParentRouter } from '../router-types';

// const Metrics = require('../../services/logging/monitoring');

class InternalController extends ParentRouter implements IExpressController {
  protected static baseRoute = 'internal/';
  private static internalVerifier(
    request: Request,
    response: Response,
    next: NextFunction,
  ) {
    if (!request.headers['x-appengine-cron']) {
      const error = new HttpError('You cannot call internal URLs', 401);
      return next(error);
    }
    return next();
  }

  public router: express.Router;

  constructor() {
    super();
    this.router = express.Router();
    this.routes(this.router);
  }

  public routes(app: express.Router): void {
    app.use(InternalController.internalVerifier);
  }
}

App.registerRouter('/', new InternalController(), 1);
