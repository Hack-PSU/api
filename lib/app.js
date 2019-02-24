"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Setup cloud specific trace and debug
const traceAgent = __importStar(require("@google-cloud/trace-agent"));
traceAgent.start();
const debugAgent = __importStar(require("@google-cloud/debug-agent"));
debugAgent.start();
const bodyParser = __importStar(require("body-parser"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const express_query_boolean_1 = __importDefault(require("express-query-boolean"));
const helmet_1 = __importDefault(require("helmet"));
const path = __importStar(require("path"));
require("source-map-support/register");
const errors_1 = require("./JSCommon/errors");
const util_1 = require("./JSCommon/util");
const router_types_1 = require("./router/router-types");
const providers_1 = require("./services/common/injector/providers");
providers_1.ExpressProvider.config();
class App extends router_types_1.ParentRouter {
    constructor() {
        super();
        this.logger = util_1.Util.getInstance('BunyanLogger');
        this.app = express_1.default();
        this.config();
    }
    static notFoundHandler(request, response, next) {
        next(new errors_1.HttpError('Not Found', 404));
    }
    errorHandler(error, request, response, next) {
        if (util_1.Util.getCurrentEnv() !== util_1.Environment.TEST) {
            this.logger.error(error);
        }
        // set locals, only providing error in development
        response.locals.message = error.message;
        response.locals.error = util_1.Util.getCurrentEnv() !== util_1.Environment.PRODUCTION ? error : {};
        // render the error page
        response.status(error.status || 500);
        const res = new router_types_1.ResponseBody('Error', error.status || 500, { result: 'Error', data: error.body });
        this.sendResponse(response, res);
        next();
    }
    config() {
        this.loggerConfig()
            .then(() => {
            // Set proxy settings
            this.app.set('trust proxy', true);
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
            .catch((error) => {
            // tslint:disable-next-line:no-console
            console.error(error);
        });
    }
    /**
     * Setup any static file handlers
     */
    staticFileConfig() {
        this.app.use(express_1.default.static(path.join(__dirname, 'public')));
    }
    /**
     * Setup the configuration for any views that need to be served
     */
    viewConfig() {
        this.app.set('views', path.join(__dirname, 'views'));
        this.app.set('view engine', 'pug');
    }
    /**
     * Setup configuration to properly parse the body in requests
     */
    parserConfig() {
        // Body parser
        this.app.use(bodyParser.json({
            limit: '10mb',
        }));
        this.app.use(bodyParser.urlencoded({ extended: false, limit: '10mb' }));
        // Setup Cookie Parser
        this.app.use(cookie_parser_1.default());
        // Setup boolean query parser
        this.app.use(express_query_boolean_1.default());
    }
    /**
     * Setup CORS and other security related configurations
     * NOTE: SSL is not configured through Express on purpose.
     * We expect that this server runs behind NGINX or some other proxy
     * that handles SSL
     */
    securityConfig() {
        // WHITELIST: Allow any subdomain of hackpsu.org or hackpsu.com
        // For testing allow any domain starting with localhost:<PORT>
        const whitelist = /^((https:\/\/)?((.*)\.)?hackpsu.(com|org))|(http:\/\/localhost:?\d*)$/;
        const corsOptions = {
            origin: (origin, callback) => {
                if (whitelist.test(origin) || util_1.Util.getCurrentEnv() !== util_1.Environment.PRODUCTION) {
                    callback(null, true);
                }
                else {
                    // Allow all requests if running on non-production environmennts
                    callback(null, false);
                }
            },
        };
        this.app.use(cors_1.default(corsOptions));
        // Setup Helmet.js
        this.app.use(helmet_1.default());
        this.app.use(helmet_1.default.hidePoweredBy());
    }
    routerConfig() {
        App.registerRouter('', 'IndexController', 2);
        App.registerRouter('live', 'LiveController', 2);
        App.registerRouter('internal', 'InternalController', 2);
        App.registerRouter('register', 'RegistrationController', 2);
        App.registerRouter('admin', 'AdminController', 2);
        App.registeredRoutes.forEach((router, key) => {
            this.app.use(key, util_1.Util.getInstance(router).router);
        });
        this.app.use('', util_1.Util.getInstance('IndexController').router);
        this.app.use('/v2/doc', express_1.default.static(path.join(__dirname, 'doc')));
        // ERROR HANDLERS
        this.app.use(App.notFoundHandler);
        this.app.use((error, request, response, next) => {
            this.errorHandler(error, request, response, next);
        });
    }
    loggerConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            if (util_1.Util.getCurrentEnv() !== util_1.Environment.TEST && util_1.Util.getCurrentEnv() !== util_1.Environment.DEBUG) {
                const loggingMw = yield this.logger.mw();
                this.app.use(loggingMw);
                this.app.use((request, response, next) => {
                    this.logger.setContext(request);
                    next();
                });
            }
            return;
        });
    }
}
exports.App = App;
exports.default = new App().app;
//# sourceMappingURL=app.js.map