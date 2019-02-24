"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const util_1 = require("../../../JSCommon/util");
class MockConnection {
    constructor() {
        this.logger = util_1.Util.getInstance('BunyanLogger');
        const qfn = (query, params, callback) => {
            this.logger.info(`Query: ${query}\n Params: ${JSON.stringify(params)}`);
            this.noop();
            if (callback) {
                callback(null, Array.of(fs_1.default.readFileSync(path_1.default.join(__dirname, './dump_text'), 'utf-8')));
            }
            return undefined;
        };
        this.query = qfn;
    }
    /**
     *
     * @return {Promise<any>}
     */
    beginTransaction(callback) {
        this.logger.info('Starting transaction');
        this.noop();
        callback();
    }
    /**
     *
     * @return {Promise<any>}
     */
    rollback(callback) {
        this.logger.error('Rolling back');
        this.noop();
        callback();
    }
    release() {
        this.logger.info('Connection released');
        this.noop();
    }
    commit(callback) {
        this.logger.info('Query committed.');
        this.noop();
        if (callback) {
            callback();
        }
    }
    changeUser(options, callback) {
        this.noop();
    }
    connect(callback, callback1) {
        this.noop();
    }
    destroy() {
        this.noop();
    }
    end(callback, callback1) {
        this.noop();
    }
    escape(value, stringifyObjects, timeZone) {
        return '';
    }
    escapeId(value, forbidQualified) {
        return '';
    }
    format(sql, values, stringifyObjects, timeZone) {
        return '';
    }
    on(ev, callback) {
        return undefined;
    }
    pause() {
        this.noop();
    }
    ping(options, callback) {
        this.noop();
    }
    resume() {
        this.noop();
    }
    statistics(options, callback) {
        this.noop();
    }
    noop() {
        return this;
    }
}
exports.MockConnection = MockConnection;
//# sourceMappingURL=mock-connection.js.map