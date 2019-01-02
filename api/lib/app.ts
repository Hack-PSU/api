import dotenv from 'dotenv';

dotenv.config();
import 'source-map-support/register';
import { ExpressProvider } from './services/common/injector/providers';

ExpressProvider.config();
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
import * as controllers from './router/routes/controllers';
import { Logger } from './services/logging/logging';
// Setup cloud specific trace and debug
if (Util.getCurrentEnv() === Environment.PRODUCTION) {
  traceAgent.start();
  debugAgent.start();
}

export class App extends ParentRouter {
  private static notFoundHandler(request, response, next: NextFunction) {
    next(new HttpError('Not Found', 404));
  }

  public app: express.Application;
  private logger: Logger = Util.getInstance('BunyanLogger');

  constructor() {
    super();
    this.app = express();
    this.config();
  }

  private errorHandler(error: HttpError, request: Request, response: Response, next: NextFunction) {
    if (Util.getCurrentEnv() === Environment.PRODUCTION || Util.getCurrentEnv() === Environment.DEBUG) {
      this.logger.error(error);
    }
    // set locals, only providing error in development
    response.locals.message = error.message;
    response.locals.error = Util.getCurrentEnv() !== Environment.PRODUCTION ? error : {};

    // render the error page
    response.status(error.status || 500);
    const res = new ResponseBody('Error', error.status || 500, error.body);
    response.send(res);
    next();
  }

  private config() {
    this.loggerConfig()
      .then(() => {
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
      })
      .catch((error) => console.error(error));
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
    App.registerRouter('', 'IndexController');
    App.registerRouter('live', 'LiveController');
    App.registerRouter('internal', 'InternalController', 1);
    App.registerRouter('register', 'RegistrationController');
    App.registeredRoutes.forEach((router, key) => {
      this.app.use(key, Util.getInstance(router).router);
    });
    this.app.use('', Util.getInstance('IndexController').router);
    this.app.use('/v1/doc', express.static(path.join(__dirname, 'doc')));

    // ERROR HANDLERS
    this.app.use(App.notFoundHandler);
    this.app.use((
      error: HttpError,
      request: Request,
      response: Response,
      next: NextFunction,
    ) => {
      this.errorHandler(error, request, response, next);
    });
  }

  private async loggerConfig() {
    const loggingMw = await this.logger.mw();
    this.app.use(loggingMw);
    this.app.use((request: Request, response, next) => {
      this.logger.setContext(request);
      next();
    });
    return;
  }
}

export default new App().app;
