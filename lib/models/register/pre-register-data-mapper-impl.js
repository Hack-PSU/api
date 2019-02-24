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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const injection_js_1 = require("injection-js");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const squel_1 = __importDefault(require("squel"));
const errors_1 = require("../../JSCommon/errors");
const auth_types_1 = require("../../services/auth/auth-types");
const generic_data_mapper_1 = require("../../services/database/svc/generic-data-mapper");
const mysql_uow_service_1 = require("../../services/database/svc/mysql-uow.service");
const logging_1 = require("../../services/logging/logging");
let PreRegisterDataMapperImpl = class PreRegisterDataMapperImpl extends generic_data_mapper_1.GenericDataMapper {
    constructor(acl, sql, activeHackathonDataMapper, logger) {
        super(acl);
        this.sql = sql;
        this.activeHackathonDataMapper = activeHackathonDataMapper;
        this.logger = logger;
        this.CREATE = 'pre-registration:create';
        this.DELETE = 'pre-registration:delete';
        this.READ = 'pre-registration:read';
        this.UPDATE = 'pre-registration:update';
        this.READ_ALL = 'pre-registration:readall';
        this.COUNT = 'pre-registration:count';
        this.tableName = 'PRE_REGISTRATION';
        this.pkColumnName = 'uid';
        super.addRBAC([this.DELETE], [auth_types_1.AuthLevel.DIRECTOR], undefined, [auth_types_1.AuthLevel[auth_types_1.AuthLevel.TEAM_MEMBER]]);
        super.addRBAC([this.READ_ALL], [auth_types_1.AuthLevel.VOLUNTEER], undefined, [auth_types_1.AuthLevel[auth_types_1.AuthLevel.PARTICIPANT]]);
        super.addRBAC([this.READ, this.UPDATE, this.CREATE], [auth_types_1.AuthLevel.PARTICIPANT]);
    }
    delete(id) {
        const query = squel_1.default.delete({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
            .from(this.tableName)
            .where(`${this.pkColumnName} = ?`, id)
            .toParam();
        query.text = query.text.concat(';');
        return rxjs_1.from(this.sql.query(query.text, query.values, { cache: false })).pipe(operators_1.map(() => ({ result: 'Success', data: undefined }))).toPromise();
    }
    get(id, opts) {
        let queryBuilder = squel_1.default.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
            .from(this.tableName);
        if (opts && opts.fields) {
            queryBuilder = queryBuilder.fields(opts.fields);
        }
        queryBuilder = queryBuilder
            .where(`${this.pkColumnName}= ?`, id);
        const query = queryBuilder.toParam();
        query.text = query.text.concat(';');
        return rxjs_1.from(this.sql.query(query.text, query.values, { cache: true }))
            .pipe(operators_1.map((event) => ({ result: 'Success', data: event[0] })))
            .toPromise();
    }
    getAll(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            let queryBuilder = squel_1.default.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
                .from(this.tableName);
            if (opts && opts.startAt) {
                queryBuilder = queryBuilder.offset(opts.startAt);
            }
            if (opts && opts.count) {
                queryBuilder = queryBuilder.limit(opts.count);
            }
            if (opts && opts.byHackathon) {
                queryBuilder = queryBuilder
                    .where('hackathon = ?', yield (opts && opts.hackathon ?
                    Promise.resolve(opts.hackathon) :
                    this.activeHackathonDataMapper.activeHackathon.pipe(operators_1.map(hackathon => hackathon.uid))
                        .toPromise()));
            }
            const query = queryBuilder
                .toParam();
            query.text = query.text.concat(';');
            return rxjs_1.from(this.sql.query(query.text, query.values, { cache: true }))
                .pipe(operators_1.map((preRegistrations) => ({
                result: 'Success',
                data: preRegistrations,
            })))
                .toPromise();
        });
    }
    getCount() {
        const query = this.getCountQuery().toParam();
        query.text = query.text.concat(';');
        return rxjs_1.from(this.sql.query(query.text, query.values, { cache: true })).pipe(operators_1.map((result) => ({ result: 'Success', data: result[0] }))).toPromise();
    }
    getCountQuery() {
        return squel_1.default.select({ autoQuoteTableNames: true, autoQuoteFieldNames: false })
            .from(this.tableName)
            .field(`COUNT(${this.pkColumnName})`, 'preregistration_count');
    }
    insert(object) {
        return __awaiter(this, void 0, void 0, function* () {
            const validation = object.validate();
            if (!validation.result) {
                this.logger.warn('Validation failed while adding object.');
                this.logger.warn(object.dbRepresentation);
                return Promise.reject({ result: 'error', data: new errors_1.HttpError(validation.error, 400) });
            }
            const query = squel_1.default.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
                .into(this.tableName)
                .setFieldsRows([object.dbRepresentation])
                .set('hackathon', yield this.activeHackathonDataMapper.activeHackathon.pipe(operators_1.map(hackathon => hackathon.uid))
                .toPromise())
                .toParam();
            query.text = query.text.concat(';');
            return rxjs_1.from(this.sql.query(query.text, query.values, { cache: false })).pipe(operators_1.map(() => ({ result: 'Success', data: object.cleanRepresentation }))).toPromise();
        });
    }
    update(object) {
        const validation = object.validate();
        if (!validation.result) {
            this.logger.warn('Validation failed while adding object.');
            this.logger.warn(object.dbRepresentation);
            return Promise.reject({ result: 'error', data: new errors_1.HttpError(validation.error, 400) });
        }
        const query = squel_1.default.update({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
            .table(this.tableName)
            .setFields(object.dbRepresentation)
            .where(`${this.pkColumnName} = ?`, object.id)
            .toParam();
        query.text = query.text.concat(';');
        return rxjs_1.from(this.sql.query(query.text, query.values, { cache: false })).pipe(operators_1.map(() => ({ result: 'Success', data: object.cleanRepresentation }))).toPromise();
    }
};
PreRegisterDataMapperImpl = __decorate([
    __param(0, injection_js_1.Inject('IAcl')),
    __param(1, injection_js_1.Inject('MysqlUow')),
    __param(2, injection_js_1.Inject('IActiveHackathonDataMapper')),
    __param(3, injection_js_1.Inject('BunyanLogger')),
    __metadata("design:paramtypes", [Object, mysql_uow_service_1.MysqlUow, Object, logging_1.Logger])
], PreRegisterDataMapperImpl);
exports.PreRegisterDataMapperImpl = PreRegisterDataMapperImpl;
//# sourceMappingURL=pre-register-data-mapper-impl.js.map