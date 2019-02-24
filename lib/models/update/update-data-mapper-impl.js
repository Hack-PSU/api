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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const injection_js_1 = require("injection-js");
const node_time_uuid_1 = __importDefault(require("node-time-uuid"));
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const errors_1 = require("../../JSCommon/errors");
const auth_types_1 = require("../../services/auth/auth-types");
const generic_data_mapper_1 = require("../../services/database/svc/generic-data-mapper");
const mysql_uow_service_1 = require("../../services/database/svc/mysql-uow.service");
const rtdb_uow_service_1 = require("../../services/database/svc/rtdb-uow.service");
const logging_1 = require("../../services/logging/logging");
let UpdateDataMapperImpl = class UpdateDataMapperImpl extends generic_data_mapper_1.GenericDataMapper {
    constructor(acl, sql, rtdb, logger, activeHackathonDataMapper) {
        super(acl);
        this.acl = acl;
        this.sql = sql;
        this.rtdb = rtdb;
        this.logger = logger;
        this.activeHackathonDataMapper = activeHackathonDataMapper;
        this.CREATE = 'event:create';
        this.DELETE = 'event:delete';
        this.READ = 'event:read';
        this.UPDATE = 'event:update';
        this.READ_ALL = 'event:readall';
        this.COUNT = 'event:count';
        this.tableName = '';
        this.pkColumnName = '';
        super.addRBAC([this.CREATE, this.UPDATE, this.DELETE], [auth_types_1.AuthLevel.TEAM_MEMBER], undefined, [auth_types_1.AuthLevel[auth_types_1.AuthLevel.VOLUNTEER]]);
        super.addRBAC([this.READ_ALL, this.READ], [
            auth_types_1.AuthLevel.PARTICIPANT,
        ]);
    }
    delete(id) {
        return rxjs_1.from(this.rtdb.query(rtdb_uow_service_1.RtdbQueryType.DELETE, [`${id.hackathon}/${id.uid}`], { cache: false })).pipe(operators_1.map(() => ({ result: 'Success', data: undefined })))
            .toPromise();
    }
    get(id, opts) {
        return rxjs_1.from(this.rtdb.query(rtdb_uow_service_1.RtdbQueryType.GET, [`${id.hackathon}/${id.uid}`], { cache: true }))
            .pipe(operators_1.map(result => ({ result: 'Success', data: result }))).toPromise();
    }
    getAll() {
        return this.activeHackathonDataMapper.activeHackathon
            .pipe(operators_1.map(hackathon => hackathon.uid), operators_1.switchMap((result) => {
            const reference = `/updates/${result}`;
            return rxjs_1.from(this.rtdb.query(rtdb_uow_service_1.RtdbQueryType.GET, [reference], undefined));
        }), operators_1.map(data => ({ result: 'Success', data: data }))).toPromise();
    }
    getCount() {
        return this.activeHackathonDataMapper.activeHackathon
            .pipe(operators_1.map(hackathon => hackathon.uid), operators_1.switchMap((result) => {
            const reference = `/updates/${result}`;
            return this.rtdb.query(rtdb_uow_service_1.RtdbQueryType.COUNT, [reference], null);
        }), operators_1.map(data => ({ result: 'Success', data: data }))).toPromise();
    }
    insert(object) {
        const validation = object.validate();
        if (!validation.result) {
            return Promise.reject({ result: 'error', data: new errors_1.HttpError(validation.error, 400) });
        }
        const uid = new node_time_uuid_1.default().toString();
        object.uid = uid;
        return this.activeHackathonDataMapper.activeHackathon
            .pipe(operators_1.map(hackathon => hackathon.uid), operators_1.switchMap(reference => this.rtdb.query(rtdb_uow_service_1.RtdbQueryType.SET, [`${reference}/${uid}`], object.dbRepresentation)), operators_1.map(result => ({ result: 'Success', data: result }))).toPromise();
    }
    update(object) {
        const validation = object.validate();
        if (!validation.result) {
            this.logger.warn('Validation failed while adding object.');
            this.logger.warn(object.dbRepresentation);
            return Promise.reject({ result: 'error', data: new errors_1.HttpError(validation.error, 400) });
        }
        return this.activeHackathonDataMapper.activeHackathon.pipe(operators_1.map(hackathon => hackathon.uid), operators_1.switchMap(reference => rxjs_1.from(this.rtdb.query(rtdb_uow_service_1.RtdbQueryType.UPDATE, [`${reference}/${object.id}`], object.dbRepresentation))), operators_1.map(result => ({ result: 'Success', data: result }))).toPromise();
    }
    getReference() {
        return this.activeHackathonDataMapper.activeHackathon.pipe(operators_1.map(hackathon => hackathon.uid), operators_1.switchMap((result) => {
            const reference = `/updates/${result}`;
            return rxjs_1.from(this.rtdb.query(rtdb_uow_service_1.RtdbQueryType.REF, [reference], null));
        }), operators_1.map(result => ({ result: 'Success', data: result })))
            .toPromise();
    }
};
UpdateDataMapperImpl = __decorate([
    __param(0, injection_js_1.Inject('IAcl')),
    __param(1, injection_js_1.Inject('MysqlUow')),
    __param(2, injection_js_1.Inject('RtdbUow')),
    __param(3, injection_js_1.Inject('BunyanLogger')),
    __param(4, injection_js_1.Inject('IActiveHackathonDataMapper')),
    __metadata("design:paramtypes", [Object, mysql_uow_service_1.MysqlUow,
        rtdb_uow_service_1.RtdbUow,
        logging_1.Logger, Object])
], UpdateDataMapperImpl);
exports.UpdateDataMapperImpl = UpdateDataMapperImpl;
//# sourceMappingURL=update-data-mapper-impl.js.map