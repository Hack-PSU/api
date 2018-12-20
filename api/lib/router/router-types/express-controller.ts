import express = require('express');

export interface IExpressController {
  router: express.Router;

  routes(app: express.Router): void;
}
