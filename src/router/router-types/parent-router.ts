import express from 'express';
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
    return Promise.resolve(eResponse.status(response.status).send(response));
  }
}
