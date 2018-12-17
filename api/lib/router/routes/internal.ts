import express, { NextFunction, Response } from 'express';
import { IExpressController } from '..';
import { App } from '../../app';
import { IHackpsuRequest } from '../../JSCommon/hackpsu-request';

// const Metrics = require('../../services/logging/monitoring');

class InternalController implements IExpressController {

  private static internalVerifier(
    request: IHackpsuRequest,
    response: Response,
    next: NextFunction,
  ) {
    if (!request.headers['x-appengine-cron']) {
      const error = new HttpError();
      error.status = 401;
      error.message = 'You cannot call internal URLs';
      return next(error);
    }
    return next();
  }

  public router: express.Router;

  constructor() {
    this.router = express.Router();
    this.routes(this.router);
  }

  public routes(app: express.Router): void {
    app.use(InternalController.internalVerifier);
  }
}

App.registerRouter('/', new InternalController().router, 1);
