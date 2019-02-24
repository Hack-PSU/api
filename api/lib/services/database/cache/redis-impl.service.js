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
Object.defineProperty(exports, "__esModule", { value: true });
var RedisCacheImpl_1;
const injection_js_1 = require("injection-js");
let RedisCacheImpl = RedisCacheImpl_1 = class RedisCacheImpl {
    constructor(redisOpts) {
        // TODO: Setup connection
    }
    static instance() {
        if (!RedisCacheImpl_1.instanceInternal) {
            RedisCacheImpl_1.init({ host: '', username: '', password: '' });
        }
        return RedisCacheImpl_1.instanceInternal;
    }
    /**
     * Initialize the in memory cache
     * @param redisOpts Connection details for redis
     */
    static init(redisOpts) {
        RedisCacheImpl_1.instanceInternal = new RedisCacheImpl_1(redisOpts);
    }
    get(key) {
        if (!this.useCache) {
            return Promise.resolve(null);
        }
        // TODO: Implement
        return Promise.resolve(null);
    }
    set(key, value) {
        if (!this.useCache) {
            return Promise.resolve();
        }
        // TODO: Implement
        return Promise.resolve();
    }
    setGlobalCacheFlag(flag) {
        this.useCache = flag;
    }
};
RedisCacheImpl = RedisCacheImpl_1 = __decorate([
    injection_js_1.Injectable(),
    __metadata("design:paramtypes", [Object])
], RedisCacheImpl);
exports.RedisCacheImpl = RedisCacheImpl;
//# sourceMappingURL=redis-impl.service.js.map