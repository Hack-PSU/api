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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const injection_js_1 = require("injection-js");
require("reflect-metadata");
const router_types_1 = require("../router-types");
let IndexController = class IndexController extends router_types_1.ParentRouter {
    constructor(indexProcessor) {
        super();
        this.indexProcessor = indexProcessor;
        this.router = express_1.default.Router();
        this.routes(this.router);
    }
    routes(app) {
        app.get('/', (req, res) => this.indexHandler(res));
    }
    indexHandler(response) {
        const r = this.indexProcessor.processIndex();
        return this.sendResponse(response, r);
    }
};
IndexController = __decorate([
    injection_js_1.Injectable(),
    __param(0, injection_js_1.Inject('IIndexProcessor')),
    __metadata("design:paramtypes", [Object])
], IndexController);
exports.IndexController = IndexController;
//# sourceMappingURL=index.js.map