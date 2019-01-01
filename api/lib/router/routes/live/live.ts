import express from 'express';
import { Injectable } from 'injection-js';
import 'reflect-metadata';
import { IExpressController, ResponseBody } from '../..';
import { Util } from '../../../JSCommon/util';
import { ParentRouter } from '../../router-types';

@Injectable()
export class LiveController extends ParentRouter implements IExpressController {
  protected static baseRoute = 'live/';

  private static liveHandler(response: express.Response) {
    const r: ResponseBody = new ResponseBody(
      'Welcome to the HackPSU Live API!',
      200,
      { result: 'Success', data: {} },
    );
    response.status(200)
      .set('content-type', 'application/json')
      .send(r);
  }

  public router: express.Router;

  constructor() {
    super();
    this.router = express.Router();
    this.routes(this.router);
  }

  public routes(app: express.Router): void {
    LiveController.registerRouter('updates', 'UpdatesController');
    LiveController.registerRouter('events', 'EventsController');
    app.get('/', (req, res) => LiveController.liveHandler(res));
  }
}
