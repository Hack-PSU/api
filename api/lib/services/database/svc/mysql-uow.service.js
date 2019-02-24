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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const injection_js_1 = require("injection-js");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const errors_1 = require("../../../JSCommon/errors");
const logging_1 = require("../../logging/logging");
var SQL_ERRORS;
(function (SQL_ERRORS) {
    SQL_ERRORS[SQL_ERRORS["DUPLICATE_KEY"] = 1062] = "DUPLICATE_KEY";
    SQL_ERRORS[SQL_ERRORS["PARSE_ERROR"] = 1064] = "PARSE_ERROR";
    SQL_ERRORS[SQL_ERRORS["SYNTAX_ERROR"] = 1149] = "SYNTAX_ERROR";
    SQL_ERRORS[SQL_ERRORS["NOT_FOUND"] = 404] = "NOT_FOUND";
    SQL_ERRORS[SQL_ERRORS["FOREIGN_KEY_DELETE_FAILURE"] = 1217] = "FOREIGN_KEY_DELETE_FAILURE";
    SQL_ERRORS[SQL_ERRORS["FOREIGN_KEY_INSERT_FAILURE"] = 1452] = "FOREIGN_KEY_INSERT_FAILURE";
    SQL_ERRORS[SQL_ERRORS["BAD_NULL_ERROR"] = 1048] = "BAD_NULL_ERROR";
    SQL_ERRORS["CONNECTION_REFUSED"] = "ECONNREFUSED";
})(SQL_ERRORS = exports.SQL_ERRORS || (exports.SQL_ERRORS = {}));
let MysqlUow = class MysqlUow {
    /**
     *
     */
    constructor(connectionFactory, cacheService, logger) {
        this.connectionFactory = connectionFactory;
        this.cacheService = cacheService;
        this.logger = logger;
        this.connectionPromise = rxjs_1.defer(() => this.connectionFactory.getConnection())
            .pipe(operators_1.catchError((error) => {
            this.logger.error(error);
            throw error;
        }));
    }
    /**
     * @param query The query string to query with.
     * This function performs SQL escaping, so any substitutable parameters should be '?'s
     * @param params Parameters to substitute in the query
     * @param opts
     * @return {Promise<any>}
     */
    query(query, params = [], opts = { cache: false }) {
        return this.connectionPromise
            .pipe(operators_1.mergeMap((connection) => {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                if (opts.cache) { // Check cache
                    try {
                        const result = yield this.cacheService.get(`${query}${params.join('')}`);
                        if (result !== null) {
                            this.complete(connection);
                            this.logger.info('served request from memory cache');
                            return resolve(result);
                        }
                    }
                    catch (err) {
                        // Error checking cache. Fallback silently.
                        this.logger.error(err);
                    }
                }
                connection.beginTransaction(() => {
                    connection.query(query, params, (err, result) => {
                        if (err) {
                            connection.rollback();
                            return reject(err);
                        }
                        if (result.length === 0) {
                            return reject({
                                sql: connection.format(query, params),
                                code: 'no data found',
                                errno: 404,
                            });
                        }
                        // Add result to cache
                        this.cacheService.set(`${query}${params.join('')}`, result)
                            .catch(cacheError => this.logger.error(cacheError));
                        this.complete(connection);
                        return resolve(result);
                    });
                });
            }));
        }), operators_1.catchError((err) => {
            this.sqlErrorHandler(err);
            return rxjs_1.from('');
        }))
            .toPromise()
            // Gracefully convert MySQL errors to HTTP Errors
            .catch((err) => this.sqlErrorHandler(err));
    }
    commit(connection) {
        return new Promise((resolve) => {
            connection.commit(() => {
                return resolve(null);
            });
        });
    }
    complete(connection) {
        return new Promise((resolve) => {
            connection.commit(() => {
                connection.release();
                return resolve(null);
            });
        });
    }
    /**
     * Converts MySQL errors to HTTP Errors
     * @param {MysqlError} error
     */
    sqlErrorHandler(error) {
        this.logger.error(error);
        switch (error.errno) {
            case SQL_ERRORS.PARSE_ERROR:
            case SQL_ERRORS.SYNTAX_ERROR:
                throw new errors_1.HttpError({ message: 'the mysql query was ill-formed' }, 500);
            case SQL_ERRORS.DUPLICATE_KEY:
                throw new errors_1.HttpError({ message: 'duplicate objects not allowed' }, 409);
            case SQL_ERRORS.FOREIGN_KEY_INSERT_FAILURE:
                throw new errors_1.HttpError({ message: 'object depends on non-existent dependency' }, 400);
            case SQL_ERRORS.FOREIGN_KEY_DELETE_FAILURE:
                throw new errors_1.HttpError({ message: 'cannot delete as this object is referenced elsewhere' }, 400);
            case SQL_ERRORS.CONNECTION_REFUSED:
                throw new errors_1.HttpError({ message: 'could not connect to the database' }, 500);
            case SQL_ERRORS.BAD_NULL_ERROR:
                throw new errors_1.HttpError({ message: 'a required property was found to be null' }, 400);
            case SQL_ERRORS.NOT_FOUND:
                throw new errors_1.HttpError({ message: 'no data was found for this query' }, 404);
        }
        // TODO: Handle other known SQL errors here
        throw error;
    }
};
MysqlUow = __decorate([
    injection_js_1.Injectable(),
    __param(0, injection_js_1.Inject('IConnectionFactory')),
    __param(1, injection_js_1.Inject('ICacheService')),
    __param(2, injection_js_1.Inject('BunyanLogger')),
    __metadata("design:paramtypes", [Object, Object, logging_1.Logger])
], MysqlUow);
exports.MysqlUow = MysqlUow;
//# sourceMappingURL=mysql-uow.service.js.map