"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Stringify = __importStar(require("streaming-json-stringify"));
const root_injector_1 = require("../services/common/injector/root-injector");
const errors_1 = require("./errors");
class Util {
    static readEnv(key, defaultValue) {
        return process.env[key] || defaultValue;
    }
    static getCurrentEnv() {
        switch (this.readEnv('APP_ENV', '')) {
            case 'PROD':
            case 'prod':
                return Environment.PRODUCTION;
            case 'STAGING':
            case 'staging':
                return Environment.STAGING;
            case 'TEST':
            case 'test':
                return Environment.TEST;
            case 'DEBUG':
            case 'debug':
                return Environment.DEBUG;
            default:
                throw new Error(`Invalid environment variable read: ${this.readEnv('APP_ENV', '')}`);
        }
    }
    static errorHandler500(err, handler) {
        this.standardErrorHandler(err, handler);
    }
    static standardErrorHandler(err, handler) {
        const error = new errors_1.HttpError(err.message || err, err.status || 500);
        handler(error);
    }
    static streamHandler(stream, res, next) {
        stream.pipe(Stringify())
            .pipe(res.type('json').status(200))
            .on('end', res.end)
            .on('error', err => Util.errorHandler500(err, next));
    }
    /**
     * Normalize a port into a number, string, or false.
     * @param val {number | string} The port
     * @return {string | number | boolean}
     */
    static normalizePort(val) {
        const port = parseInt(val, 10);
        if (isNaN(port)) {
            // named pipe
            return val;
        }
        if (port >= 0) {
            // port number
            return port;
        }
        return false;
    }
    /**
     * Returns an instance from the Dependency Framework of the
     * requested type.
     */
    static getInstance(token) {
        return root_injector_1.RootInjector.getInjector().get(token);
    }
}
exports.Util = Util;
var Environment;
(function (Environment) {
    Environment[Environment["STAGING"] = 0] = "STAGING";
    Environment[Environment["TEST"] = 1] = "TEST";
    Environment[Environment["PRODUCTION"] = 2] = "PRODUCTION";
    Environment[Environment["DEBUG"] = 3] = "DEBUG";
})(Environment = exports.Environment || (exports.Environment = {}));
//# sourceMappingURL=util.js.map