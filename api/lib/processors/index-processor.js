"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * This class handles any processing functions the Api needs
 */
const injection_js_1 = require("injection-js");
const router_types_1 = require("../router/router-types");
let IndexProcessor = class IndexProcessor {
    processIndex() {
        return new router_types_1.ResponseBody('Welcome to the HackPSU API!', 200, { result: 'Success', data: {} });
    }
};
IndexProcessor = __decorate([
    injection_js_1.Injectable()
], IndexProcessor);
exports.IndexProcessor = IndexProcessor;
//# sourceMappingURL=index-processor.js.map