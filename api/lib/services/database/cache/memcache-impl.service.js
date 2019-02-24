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
const injection_js_1 = require("injection-js");
const DEFAULT_SIZE = 100;
/**
 * In memory LRU Cache implementation
 */
let MemCacheServiceImpl = class MemCacheServiceImpl {
    /**
     * Private constructor for singleton
     */
    constructor() {
        this.cache = new Map();
        this.size = DEFAULT_SIZE;
        this.useCache = true;
    }
    get(key) {
        if (!this.useCache) {
            return Promise.resolve(null);
        }
        const hasKey = this.cache.has(key);
        let entry = null;
        if (hasKey) {
            // peek the entry, re-insert for LRU strategy
            entry = this.cache.get(key);
            this.cache.delete(key);
            this.cache.set(key, entry);
        }
        return Promise.resolve(entry);
    }
    set(key, value) {
        if (!this.useCache) {
            return Promise.resolve();
        }
        if (this.cache.size >= this.size) {
            // least-recently used cache eviction strategy
            const keyToDelete = this.cache.keys().next().value;
            this.cache.delete(keyToDelete);
        }
        this.cache.set(key, value);
        return Promise.resolve();
    }
    setGlobalCacheFlag(flag) {
        this.useCache = flag;
    }
};
MemCacheServiceImpl = __decorate([
    injection_js_1.Injectable(),
    __metadata("design:paramtypes", [])
], MemCacheServiceImpl);
exports.MemCacheServiceImpl = MemCacheServiceImpl;
//# sourceMappingURL=memcache-impl.service.js.map