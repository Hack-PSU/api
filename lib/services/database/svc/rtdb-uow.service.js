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
Object.defineProperty(exports, "__esModule", { value: true });
const injection_js_1 = require("injection-js");
const util_1 = require("../../../JSCommon/util");
const logging_1 = require("../../logging/logging");
var RtdbQueryType;
(function (RtdbQueryType) {
    RtdbQueryType[RtdbQueryType["COUNT"] = 0] = "COUNT";
    RtdbQueryType[RtdbQueryType["DELETE"] = 1] = "DELETE";
    RtdbQueryType[RtdbQueryType["GET"] = 2] = "GET";
    RtdbQueryType[RtdbQueryType["REF"] = 3] = "REF";
    RtdbQueryType[RtdbQueryType["SET"] = 4] = "SET";
    RtdbQueryType[RtdbQueryType["UPDATE"] = 5] = "UPDATE";
})(RtdbQueryType = exports.RtdbQueryType || (exports.RtdbQueryType = {}));
let RtdbUow = class RtdbUow {
    constructor(databaseFactory, logger) {
        this.databaseFactory = databaseFactory;
        this.logger = logger;
        this.db = databaseFactory.getDatabase();
    }
    /**
     *
     * @param query {enum} GET, SET, REF
     * @param reference {String} A reference in the database
     * @param [data] {Object} Data if query is SET
     * @returns {Promise<DataSnapshot>}
     */
    query(query, reference, data) {
        if (util_1.Util.getCurrentEnv() === util_1.Environment.DEBUG) {
            this.logger.info({ query, reference, data });
        }
        this.db.goOnline();
        switch (query) {
            case RtdbQueryType.GET:
                return this._get(reference[0]);
            case RtdbQueryType.SET:
                return this._set(data, reference[0]);
            case RtdbQueryType.REF:
                return Promise.resolve(this.db.ref(reference[0])
                    .toString());
            case RtdbQueryType.COUNT:
                return this._count(reference[0]);
            case RtdbQueryType.UPDATE:
                return this._set(data, reference[0]);
            default:
                return Promise.reject(new Error('Illegal query'));
        }
    }
    _get(reference) {
        return new Promise((resolve, reject) => {
            this.db.ref(reference)
                .once('value', (data) => {
                const firebaseData = data.val();
                let result = [];
                if (firebaseData) {
                    result = Object
                        .entries(firebaseData)
                        .map((pair) => {
                        const r = {};
                        [, r[pair[0]]] = pair;
                        return r;
                    });
                }
                resolve(result);
            })
                .catch(reject);
        });
    }
    _count(reference) {
        return new Promise((resolve) => {
            let count = 0;
            this.db.ref(reference)
                .on('child_added', () => {
                count += 1;
            });
            this.db.ref(reference)
                .once('value', () => {
                resolve(count);
            });
        });
    }
    complete() {
        return Promise.resolve();
    }
    _set(data, reference) {
        return new Promise((resolve, reject) => {
            if (!data) {
                reject(new Error('opts.data must be provided'));
                return;
            }
            this.db.ref(reference)
                .transaction(() => data, (error, committed, snapshot) => {
                if (error) {
                    return reject(error);
                }
                if (!snapshot) {
                    return reject(new Error('Could not write'));
                }
                const returnObject = {};
                returnObject[snapshot.key] = snapshot.val();
                resolve(returnObject);
            }, true)
                .catch(reject);
        });
    }
    commit() {
        return Promise.resolve();
    }
};
RtdbUow = __decorate([
    injection_js_1.Injectable(),
    __param(0, injection_js_1.Inject('IRtdbFactory')),
    __param(1, injection_js_1.Inject('BunyanLogger')),
    __metadata("design:paramtypes", [Object, logging_1.Logger])
], RtdbUow);
exports.RtdbUow = RtdbUow;
//# sourceMappingURL=rtdb-uow.service.js.map