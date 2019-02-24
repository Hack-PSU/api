import express from 'express';
import { Injectable } from 'injection-js';
import 'reflect-metadata';
import { IExpressController, ResponseBody } from '../..';
import { ParentRouter } from '../../router-types';

@Injectable()
export class LiveController extends ParentRouter implements IExpressController {
  protected static baseRoute = 'live/';

  public router: express.Router;

  constructor() {
    super();
    this.router = express.Router();
    this.routes(this.router);
  }

  public routes(app: express.Router): void {
    LiveController.registerRouter('updates', 'UpdatesController', 2);
    LiveController.registerRouter('events', 'EventsController', 2);
    app.get('/', (req, res) => this.liveHandler(res));
  }

  private liveHandler(response: express.Response) {
    const r: ResponseBody = new ResponseBody(
      'Welcome to the HackPSU Live API!',
      200,
      { result: 'Success', data: {} },
    );
    return this.sendResponse(response, r);
  }
}
