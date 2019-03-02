import express from 'express';
import { Inject, Injectable } from 'injection-js';
import 'reflect-metadata';
import { IExpressController } from '..';
import { IIndexProcessor } from '../../processors/index-processor';
import { ParentRouter } from '../router-types';

@Injectable()
export class IndexController extends ParentRouter implements IExpressController {
  public readonly router: express.Router;

  constructor(
    @Inject('IIndexProcessor') private readonly indexProcessor: IIndexProcessor,
  ) {
    super();
    this.router = express.Router();
    this.routes(this.router);
  }

  public routes(app: express.Router): void {
    app.get('/', (req, res) => this.indexHandler(res));
  }

  private indexHandler(response: express.Response) {
    const r = this.indexProcessor.processIndex();
    return this.sendResponse(response, r);
  }
}
