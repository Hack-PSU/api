import express from 'express';
import { NodeReadable, Stream } from 'ts-stream';
import { ResponseBody } from './response-body';

export abstract class ParentRouter {
  public static registerRouter(route: string, routerToken: string, version: number = 1) {
    this.registeredRoutes.set(`/v${version}/${this.baseRoute}${route}`, routerToken);
  }

  protected static registeredRoutes: Map<string, string> = new Map<string, string>();
  protected static baseRoute = '';

  private static setResponseHeaders(eResponse: express.Response) {
    eResponse.setHeader('X-API-version', '2.0');
  }

  protected sendResponse(eResponse: express.Response, response: ResponseBody): Promise<any> {
    ParentRouter.setResponseHeaders(eResponse);
    if (response.body.data instanceof Stream) {
      return new Promise((resolve, reject) => {
        new NodeReadable(
          (response.body.data as Stream<any>)
            .map(data => JSON.stringify(data)),
        )
          .pipe(eResponse.type('json').status(response.status))
          .on('end', () => {
            resolve(eResponse);
          })
          .on('error', error => reject(error));
      });
    }
    return Promise.resolve(eResponse.status(response.status).send(response));
  }
}
