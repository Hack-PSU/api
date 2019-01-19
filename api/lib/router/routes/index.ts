import express from 'express';
import { Injectable } from 'injection-js';
import 'reflect-metadata';
import { IExpressController, ResponseBody } from '..';
import { ParentRouter } from '../router-types';

@Injectable()
export class IndexController extends ParentRouter implements IExpressController {
  public readonly router: express.Router;

  constructor() {
    super();
    this.router = express.Router();
    this.routes(this.router);
  }

  public routes(app: express.Router): void {
    app.get('/', (req, res) => this.indexHandler(res));
  }

  private indexHandler(response: express.Response) {
    const r: ResponseBody = new ResponseBody(
      'Welcome to the HackPSU API!',
      200,
      { result: 'Success', data: {} },
    );
    return this.sendResponse(response, r);
  }
}
