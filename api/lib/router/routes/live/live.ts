import express from 'express';
import { Injectable } from 'injection-js';
import { IExpressController } from '../..';
import { ParentRouter } from '../../router-types';

@Injectable()
export default class LiveController extends ParentRouter implements IExpressController {
  protected static baseRoute = 'live/';
  public router: express.Router;
  constructor() {
    super();
    this.router = express.Router();
    this.routes(this.router);
  }

  public routes(app: express.Router): void {
    LiveController.registeredRoutes.forEach((subrouter, key) => {
      app.use(key, subrouter.router);
    });
  }
}
