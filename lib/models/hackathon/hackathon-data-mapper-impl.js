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
let HackathonDataMapperImpl = class HackathonDataMapperImpl extends generic_data_mapper_1.GenericDataMapper {
    constructor(acl, sql, logger) {
        super(acl);
        this.sql = sql;
        this.logger = logger;
        this.CREATE = 'hackathon:create';
        this.DELETE = 'hackathon:delete';
        this.READ = 'hackathon:read';
        this.UPDATE = 'hackathon:update';
        this.READ_ALL = 'hackathon:readall';
        this.COUNT = 'hackathon:count';
        this.tableName = 'HACKATHON';
        this.pkColumnName = 'uid';
        super.addRBAC([this.CREATE, this.UPDATE], [auth_types_1.AuthLevel.DIRECTOR], undefined, [auth_types_1.AuthLevel[auth_types_1.AuthLevel.TEAM_MEMBER]]);
        super.addRBAC([this.DELETE], [auth_types_1.AuthLevel.TECHNOLOGY], undefined, [auth_types_1.AuthLevel[auth_types_1.AuthLevel.DIRECTOR]]);
        super.addRBAC([this.READ, this.READ_ALL], [
            auth_types_1.AuthLevel.PARTICIPANT,
        ]);
    }
    delete(id) {
        throw new errors_1.MethodNotImplementedError('Cannot delete Hackathon entry yet');
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
    getAll() {
        const query = squel_1.default.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
            .from(this.tableName)
            .toString()
            .concat(';');
        return rxjs_1.from(this.sql.query(query, [], { cache: true }))
            .pipe(operators_1.map((hackathons) => ({ result: 'Success', data: hackathons })))
            .toPromise();
    }
    getCount() {
        const query = squel_1.default.select({ autoQuoteTableNames: true, autoQuoteFieldNames: false })
            .from(this.tableName)
            .field(`COUNT(${this.pkColumnName})`, 'count')
            .toString()
            .concat(';');
        return rxjs_1.from(this.sql.query(query, [], { cache: true })).pipe(operators_1.map((result) => ({ result: 'Success', data: result[0] }))).toPromise();
    }
    insert(object) {
        const validation = object.validate();
        if (!validation.result) {
            this.logger.warn('Validation failed while adding object.');
            this.logger.warn(object.dbRepresentation);
            return Promise.reject({ result: 'error', data: new errors_1.HttpError(validation.error, 400) });
        }
        let queryBuilder = squel_1.default.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
            .into(this.tableName)
            .setFieldsRows([object.dbRepresentation]);
        if (object.base_pin === undefined || object.base_pin === null) {
            queryBuilder = queryBuilder.set('base_pin', squel_1.default.select({ autoQuoteFieldNames: false, autoQuoteTableNames: false })
                .from('REGISTRATION LOCK IN SHARE MODE')
                .field('MAX(pin)'));
        }
        const query = queryBuilder.toParam();
        query.text = query.text.concat(';');
        return rxjs_1.from(this.sql.query(query.text, query.values, { cache: false })).pipe(operators_1.map(() => ({ result: 'Success', data: object.cleanRepresentation }))).toPromise();
    }
    update(object) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentDbObject = yield this.get(object.id);
            const currentObject = object.merge(currentDbObject.data, object);
            const validation = currentObject.validate();
            if (!validation.result) {
                this.logger.warn('Validation failed while adding object.');
                this.logger.warn(currentObject.dbRepresentation);
                return Promise.reject(new errors_1.HttpError(validation.error, 400));
            }
            const query = squel_1.default.update({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
                .table(this.tableName)
                .setFields(currentObject.dbRepresentation)
                .where(`${this.pkColumnName} = ?`, currentObject.id)
                .toParam();
            query.text = query.text.concat(';');
            return rxjs_1.from(this.sql.query(query.text, query.values, { cache: false })).pipe(operators_1.map(() => ({ result: 'Success', data: currentObject.cleanRepresentation }))).toPromise();
        });
    }
};
HackathonDataMapperImpl = __decorate([
    __param(0, injection_js_1.Inject('IAcl')),
    __param(1, injection_js_1.Inject('MysqlUow')),
    __param(2, injection_js_1.Inject('BunyanLogger')),
    __metadata("design:paramtypes", [Object, mysql_uow_service_1.MysqlUow,
        logging_1.Logger])
], HackathonDataMapperImpl);
exports.HackathonDataMapperImpl = HackathonDataMapperImpl;
//# sourceMappingURL=hackathon-data-mapper-impl.js.map