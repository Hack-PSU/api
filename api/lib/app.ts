import dotenv from 'dotenv';
dotenv.config();
import * as debugAgent from '@google-cloud/debug-agent';
import * as traceAgent from '@google-cloud/trace-agent';
import * as bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import * as path from 'path';
import { HttpError } from './JSCommon/errors';
import { Environment, Util } from './JSCommon/util';
import { ParentRouter, ResponseBody } from './router/router-types';
import * as Controllers from './router/routes/controllers';
import { RootInjector } from './services/common/injector/root-injector';
import { logger } from './services/logging/logging';

// Setup cloud specific trace and debug
if (Util.getCurrentEnv() === Environment.PRODUCTION) {
  traceAgent.start();
  debugAgent.start();
}

export class App extends ParentRouter {
  private static notFoundHandler(request, response, next: NextFunction) {
    next(new HttpError('Not Found', 404));
  }

  private static errorHandler(error: HttpError, response: Response) {
    if (Util.getCurrentEnv() === Environment.PRODUCTION || Util.getCurrentEnv() === Environment.DEBUG) {
      logger.error(error);
    }
    // set locals, only providing error in development
    response.locals.message = error.message;
    response.locals.error = Util.getCurrentEnv() !== Environment.PRODUCTION ? error : {};

    // render the error page
    response.status(error.status || 500);
    const res = new ResponseBody('Error', error.status || 500, error.body);
    response.send(res);
  }

  public app: express.Application;

  constructor() {
    super();
    this.app = express();
    this.config();
  }

  private config() {
    // Set proxy settings
    this.app.set('trust proxy', true);

    // Setup database handlers
    // this.uowConfig();

    // Setup CORS and other security options
    this.securityConfig();

    // Setup views
    this.viewConfig();

    // Setup body parser
    this.parserConfig();

    // Setup static files
    this.staticFileConfig();

    // Setup routers
    this.routerConfig();
  }

  /**
   * Setup any static file handlers
   */
  private staticFileConfig() {
    this.app.use(express.static(path.join(__dirname, 'public')));
  }

  /**
   * Setup the configuration for any views that need to be served
   */
  private viewConfig() {
    this.app.set('views', path.join(__dirname, 'views'));
    this.app.set('view engine', 'pug');
  }

  /**
   * Setup configuration to properly parse the body in requests
   */
  private parserConfig() {
    // Body parser
    this.app.use(bodyParser.json({
      limit: '10mb',
    }));
    this.app.use(bodyParser.urlencoded({ extended: false, limit: '10mb' }));

    // Setup Cookie Parser
    this.app.use(cookieParser());
  }

  // /**
  //  * Sets up connections to the database in the form of
  //  * units of work.
  //  * Each request gets one unit of work with the database,
  //  * and this gets closed out once the request completes
  //  */
  // private uowConfig() {
  //
  //   // TODO: Create MySQL DB UOW
  //
  //   // TODO: Create Realtime DB UOW
  //   // this.uowCleanupConfig();
  // }

  // /**
  //  * Sets up the cleanup for a UOW on a connected request.
  //  * Once the request completes, this will cleanup any pending
  //  * connections
  //  */
  // private uowCleanupConfig() {
  //   this.app.use((request: Request, response: Response, next: NextFunction) => {
  //     if (request.uow) {
  //       const complete = async () => request.uow.complete();
  //       response.on('finish', complete);
  //       response.on('close', complete);
  //     }
  //     next();
  //   });
  // }

  /**
   * Setup CORS and other security related configurations
   * NOTE: SSL is not configured through Express on purpose.
   * We expect that this server runs behind NGINX or some other proxy
   * that handles SSL
   */
  private securityConfig() {
    // WHITELIST: Allow any subdomain of hackpsu.org or hackpsu.com
    // For testing allow any domain starting with localhost:<PORT>
    const whitelist = /^((https:\/\/)?((.*)\.)?hackpsu.(com|org))|(http:\/\/localhost:?\d*)$/;
    const corsOptions = {
      origin: (origin, callback) => {
        if (whitelist.test(origin) || Util.getCurrentEnv() !== Environment.PRODUCTION) {
          callback(null, true);
        } else {
          // Allow all requests if running on non-production environmennts
          callback(null, false);
        }
      },
    };
    this.app.use(cors(corsOptions));

    // Setup Helmet.js
    this.app.use(helmet());
    this.app.use(helmet.hidePoweredBy());
  }

  private routerConfig() {
    App.registerRouter('', new Controllers.IndexController());
    App.registerRouter('live', RootInjector.getInjector().get(Controllers.LiveController));
    App.registeredRoutes.forEach((router, key) => {
      this.app.use(key, router.router);
    });
    this.app.use('', new Controllers.IndexController().router);
    this.app.use('/v1/doc', express.static(path.join(__dirname, 'doc')));

    // ERROR HANDLERS
    this.app.use(App.notFoundHandler);
    this.app.use((
      error: HttpError,
      request: Request,
      response: Response,
      next: NextFunction,
    ) => {
      App.errorHandler(error, response);
    });
  }
}

export default new App().app;
