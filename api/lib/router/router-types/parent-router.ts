import express from 'express';
import { Stream } from 'stream';
import * as Stringify from 'streaming-json-stringify';
import { IExpressController } from '.';
import { ResponseBody } from './response-body';

export class ParentRouter {
  public static registerRouter(route: string, router: IExpressController, version: number = 1) {
    this.registeredRoutes.set(`v${version}/route`, router);
  }

  protected static registeredRoutes: Map<string, IExpressController> =
    new Map<string, IExpressController>();

  protected sendResponse(eResponse: express.Response, response: ResponseBody): Promise<any> {
    if (response.body instanceof Stream) {
      return new Promise((resolve, reject) => {
        (response.body as Stream).pipe(Stringify())
          .pipe(eResponse.type('json').status(response.status))
          .on('end', () => {
            eResponse.end();
            resolve(eResponse);
          })
          .on('error', (error) => reject(error));
      });
    }
    return Promise.resolve(eResponse.status(response.status).send(response));
  }
}
