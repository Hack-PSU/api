"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
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
const bunyan = __importStar(require("bunyan"));
const dev_null_1 = __importDefault(require("dev-null"));
const injection_js_1 = require("injection-js");
require("reflect-metadata");
// tslint:disable:no-var-requires
const { express } = require('@google-cloud/logging-bunyan');
const LOGGER_NAME = 'hackpsu-api';
let Logger = class Logger {
    constructor() {
        switch (process.env.APP_ENV) {
            case 'TEST':
            case 'test':
                this.bunyan = bunyan.createLogger({
                    name: LOGGER_NAME,
                    streams: [
                        // stdout logging
                        { stream: dev_null_1.default(), level: 'debug' },
                    ],
                });
                break;
            default:
                this.bunyan = bunyan.createLogger({
                    name: LOGGER_NAME,
                    streams: [
                        // stdout logging
                        { stream: process.stdout, level: 'info' },
                        { stream: process.stderr, level: 'error' },
                    ],
                });
        }
    }
    mw() {
        return __awaiter(this, void 0, void 0, function* () {
            const { mw } = yield express.middleware({
                level: 'trace',
                logName: LOGGER_NAME,
            });
            return mw;
        });
    }
    setContext(request) {
        this.request = request;
    }
    debug(...message) {
        if (this.request) {
            this.request.log.debug(...message);
        }
        this.bunyan.debug(message);
    }
    info(...message) {
        if (this.request) {
            this.request.log.info(...message);
        }
        this.bunyan.info(message);
    }
    error(...message) {
        if (this.request) {
            this.request.log.error(...message);
        }
        this.bunyan.error(message);
    }
    warn(...message) {
        if (this.request) {
            this.request.log.warn(...message);
        }
        this.bunyan.warn(message);
    }
};
Logger = __decorate([
    injection_js_1.Injectable(),
    __metadata("design:paramtypes", [])
], Logger);
exports.Logger = Logger;
//# sourceMappingURL=logging.js.map