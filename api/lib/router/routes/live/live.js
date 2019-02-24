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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var LiveController_1;
const express_1 = __importDefault(require("express"));
const injection_js_1 = require("injection-js");
require("reflect-metadata");
const __1 = require("../..");
const router_types_1 = require("../../router-types");
let LiveController = LiveController_1 = class LiveController extends router_types_1.ParentRouter {
    constructor() {
        super();
        this.router = express_1.default.Router();
        this.routes(this.router);
    }
    routes(app) {
        LiveController_1.registerRouter('updates', 'UpdatesController', 2);
        LiveController_1.registerRouter('events', 'EventsController', 2);
        app.get('/', (req, res) => this.liveHandler(res));
    }
    liveHandler(response) {
        const r = new __1.ResponseBody('Welcome to the HackPSU Live API!', 200, { result: 'Success', data: {} });
        return this.sendResponse(response, r);
    }
};
LiveController.baseRoute = 'live/';
LiveController = LiveController_1 = __decorate([
    injection_js_1.Injectable(),
    __metadata("design:paramtypes", [])
], LiveController);
exports.LiveController = LiveController;
//# sourceMappingURL=live.js.map