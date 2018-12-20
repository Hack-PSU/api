import express from 'express';
import { NodeReadable, Stream } from 'ts-stream';
import { IExpressController } from './express-controller';
import { ResponseBody } from './response-body';

export abstract class ParentRouter {
  public static registerRouter(route: string, router: IExpressController, version: number = 1) {
    this.registeredRoutes.set(`/v${version}/${this.baseRoute}${route}`, router);
  }

  protected static registeredRoutes: Map<string, IExpressController> =
    new Map<string, IExpressController>();
  protected static baseRoute = '';

  protected sendResponse(eResponse: express.Response, response: ResponseBody): Promise<any> {
    if (response.body.data instanceof Stream) {
      return new Promise((resolve, reject) => {
        new NodeReadable((response.body.data as Stream<any>)
          .map(data => JSON.stringify(data)))
          .pipe(eResponse.type('json').status(response.status))
          .on('end', () => {
            resolve(eResponse);
          })
          .on('error', (error) => reject(error));
      });
    }
    return Promise.resolve(eResponse.status(response.status).send(response));
  }
}
