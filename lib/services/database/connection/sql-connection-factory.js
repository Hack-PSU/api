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
const mysql_1 = require("mysql");
const constants_1 = require("../../../assets/constants/constants");
const util_1 = require("../../../JSCommon/util");
let SqlConnectionFactory = class SqlConnectionFactory {
    constructor() {
        if (util_1.Util.readEnv('INSTANCE_CONNECTION_NAME', '') !== '') {
            constants_1.Constants.sqlConnection.host = '';
        }
        else {
            constants_1.Constants.sqlConnection.socketPath = '';
        }
        this.dbConnection = mysql_1.createPool(constants_1.Constants.sqlConnection);
    }
    getConnection() {
        return new Promise(((resolve, reject) => {
            this.dbConnection.getConnection((err, connection) => {
                if (err)
                    return reject(err);
                return resolve(connection);
            });
        }));
    }
};
SqlConnectionFactory = __decorate([
    injection_js_1.Injectable(),
    __metadata("design:paramtypes", [])
], SqlConnectionFactory);
exports.SqlConnectionFactory = SqlConnectionFactory;
//# sourceMappingURL=sql-connection-factory.js.map