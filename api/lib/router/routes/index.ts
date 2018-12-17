import express from 'express';
import { IExpressController, ResponseBody } from '..';
import { App } from '../../app';
import { IHackpsuRequest } from '../../JSCommon/hackpsu-request';

class IndexController implements IExpressController {

  private static indexHandler(request: IHackpsuRequest, response: express.Response) {
    const r: ResponseBody = new ResponseBody(
      'Welcome to the HackPSU API!',
      200,
      {},
    );
    response.status(200)
      .set('content-type', 'application/json')
      .send(r);
  }
  public readonly router: express.Router;

  constructor() {
    this.router = express.Router();
    this.routes(this.router);
  }

  public routes(app: express.Router): void {
    app.get('/', IndexController.indexHandler);
  }
}

App.registerRouter('/', new IndexController(), 1);
