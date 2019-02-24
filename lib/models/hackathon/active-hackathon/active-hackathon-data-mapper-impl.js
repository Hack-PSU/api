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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const injection_js_1 = require("injection-js");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const squel = __importStar(require("squel"));
const auth_types_1 = require("../../../services/auth/auth-types");
const mysql_uow_service_1 = require("../../../services/database/svc/mysql-uow.service");
const logging_1 = require("../../../services/logging/logging");
const hackathon_data_mapper_impl_1 = require("../hackathon-data-mapper-impl");
let ActiveHackathonDataMapperImpl = class ActiveHackathonDataMapperImpl extends hackathon_data_mapper_impl_1.HackathonDataMapperImpl {
    constructor(acl, sql, logger) {
        super(acl, sql, logger);
        this.sql = sql;
        this.logger = logger;
        this.CREATE = 'active-hackathon:create';
        this.DELETE = 'active-hackathon:delete';
        this.READ = 'active-hackathon:read';
        this.UPDATE = 'active-hackathon:update';
        this.COUNT = 'active-hackathon:count';
        super.addRBAC([this.CREATE, this.UPDATE], [auth_types_1.AuthLevel.DIRECTOR], undefined, [auth_types_1.AuthLevel[auth_types_1.AuthLevel.TEAM_MEMBER]]);
        super.addRBAC([this.DELETE], [auth_types_1.AuthLevel.TECHNOLOGY], undefined, [auth_types_1.AuthLevel[auth_types_1.AuthLevel.DIRECTOR]]);
        super.addRBAC([this.READ, this.READ_ALL], [
            auth_types_1.AuthLevel.PARTICIPANT,
        ]);
    }
    get activeHackathon() {
        const query = this.getActiveHackathonQuery().toParam();
        if (!this.hackathonObservable) {
            this.hackathonObservable = rxjs_1.from(this.sql.query(query.text, query.values))
                .pipe(operators_1.map((hackathons) => hackathons[0]), operators_1.shareReplay());
        }
        return this.hackathonObservable;
    }
    makeActive(id) {
        // Make current hackathon inactive
        const activeQuery = squel.update({
            autoQuoteFieldNames: true,
            autoQuoteTableNames: true,
        })
            .table(this.tableName)
            .set('active', false)
            .set('end_time', Date.now().toString())
            .where('active = ?', true)
            .toParam();
        // Make provided hackathon active
        const newHackathonQuery = squel.update({
            autoQuoteFieldNames: true,
            autoQuoteTableNames: true,
        })
            .table(this.tableName)
            .set('active', true)
            .set('base_pin', squel.select({
            autoQuoteFieldNames: false,
            autoQuoteTableNames: false,
        })
            .from('REGISTRATION FOR UPDATE')
            .field('MAX(pin)'))
            .where(`${this.pkColumnName} = ?`, id)
            .toParam();
        const query = {
            text: activeQuery.text.concat(';').concat(newHackathonQuery.text).concat(';'),
            values: activeQuery.values.concat(newHackathonQuery.values),
        };
        return rxjs_1.from(this.sql.query(query.text, query.values, { cache: false }))
            .pipe(
        // Update hackathon observable
        operators_1.switchMap(() => {
            this.hackathonObservable = undefined;
            return this.activeHackathon;
        }), operators_1.map((hackathon) => ({ result: 'Success', data: hackathon })))
            .toPromise();
    }
    getActiveHackathonQuery() {
        return squel.select({
            autoQuoteFieldNames: true,
            autoQuoteTableNames: true,
        })
            .field('uid')
            .from(this.tableName)
            .where('active = ?', true);
    }
};
ActiveHackathonDataMapperImpl = __decorate([
    injection_js_1.Injectable(),
    __param(0, injection_js_1.Inject('IAcl')),
    __param(1, injection_js_1.Inject('MysqlUow')),
    __param(2, injection_js_1.Inject('BunyanLogger')),
    __metadata("design:paramtypes", [Object, mysql_uow_service_1.MysqlUow,
        logging_1.Logger])
], ActiveHackathonDataMapperImpl);
exports.ActiveHackathonDataMapperImpl = ActiveHackathonDataMapperImpl;
//# sourceMappingURL=active-hackathon-data-mapper-impl.js.map