import express = require('express');
export { ResponseBody } from './response-body';
export { ParentRouter } from './parent-router';

export interface IExpressController {
  router: express.Router;

  routes(app: express.Router): void;
}
