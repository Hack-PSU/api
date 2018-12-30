import express from 'express';
import { Injectable } from 'injection-js';
import 'reflect-metadata';
import { IExpressController, ResponseBody } from '..';
import { ParentRouter } from '../router-types';

@Injectable()
export class IndexController extends ParentRouter implements IExpressController {

  private static indexHandler(response: express.Response) {
    const r: ResponseBody = new ResponseBody(
      'Welcome to the HackPSU API!',
      200,
      { result: 'Success', data: {} },
    );
    response.status(200)
      .set('content-type', 'application/json')
      .send(r);
  }
  public readonly router: express.Router;

  constructor() {
    super();
    this.router = express.Router();
    this.routes(this.router);
  }

  public routes(app: express.Router): void {
    app.get('/', (req, res) => IndexController.indexHandler(res));
  }
}
