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
const auth_types_1 = require("../../../services/auth/auth-types");
const generic_data_mapper_1 = require("../../../services/database/svc/generic-data-mapper");
const mysql_uow_service_1 = require("../../../services/database/svc/mysql-uow.service");
let AdminStatisticsDataMapperImpl = class AdminStatisticsDataMapperImpl extends generic_data_mapper_1.GenericDataMapper {
    constructor(acl, authService, sql, preRegDataMapper, registerDataMapper, rsvpDataMapper, scannerDataMapper, hackathonDataMapper) {
        super(acl);
        this.acl = acl;
        this.authService = authService;
        this.sql = sql;
        this.preRegDataMapper = preRegDataMapper;
        this.registerDataMapper = registerDataMapper;
        this.rsvpDataMapper = rsvpDataMapper;
        this.scannerDataMapper = scannerDataMapper;
        this.hackathonDataMapper = hackathonDataMapper;
        this.READ = 'statistics:read';
        super.addRBAC(this.READ, [auth_types_1.AuthLevel.TEAM_MEMBER], undefined, [auth_types_1.AuthLevel[auth_types_1.AuthLevel.VOLUNTEER]]);
    }
    getUserCountByCategory(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = squel_1.default.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
                .from(this.preRegDataMapper.getCountQuery(), 'a')
                .join(yield this.registerDataMapper.getCountQuery(opts), 'b')
                .join(yield this.rsvpDataMapper.getCountQuery(opts), 'c')
                .join(yield this.scannerDataMapper.getCountQuery(opts), 'd')
                .toParam();
            query.text = query.text.concat(';');
            return rxjs_1.from(this.sql.query(query.text, query.values, { cache: true })).pipe(operators_1.map((result) => ({ result: 'Success', data: result }))).toPromise();
        });
    }
    getAllUserData(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            let queryBuilder = squel_1.default.select({ autoQuoteFieldNames: false, autoQuoteTableNames: true })
                .distinct()
                .field('pre_reg.uid', 'pre_uid')
                .field('reg.*')
                .field('reg.pin - hackathon.base_pin', 'pin')
                .field('hackathon.name')
                .field('hackathon.start_time')
                .field('hackathon.end_time')
                .field('hackathon.base_pin')
                .field('hackathon.active')
                .field('rsvp.user_id')
                .field('rsvp.rsvp_time')
                .field('rsvp.rsvp_status')
                .field('rfid.user_uid')
                .from(this.preRegDataMapper.tableName, 'pre_reg')
                .right_join(this.registerDataMapper.tableName, 'reg', 'pre_reg.email = reg.email')
                .join(this.hackathonDataMapper.tableName, 'hackathon', 'reg.hackathon = hackathon.uid')
                // TODO: Change to the table name field once rsvp data mapper is created
                .left_join('RSVP', 'rsvp', 'reg.uid = rsvp.user_id')
                // TODO: Change to the table name field once rfid data mapper is created
                .left_join('RFID_ASSIGNMENTS', 'rfid', 'reg.uid = rfid.user_uid');
            if (opts && opts.byHackathon) {
                queryBuilder = queryBuilder
                    .where('reg.hackathon = ?', yield (opts.hackathon ?
                    Promise.resolve(opts.hackathon) :
                    this.hackathonDataMapper.activeHackathon
                        .pipe(operators_1.map(hackathon => hackathon.uid))
                        .toPromise()));
            }
            if (opts && opts.startAt) {
                queryBuilder = queryBuilder.offset(opts.startAt);
            }
            if (opts && opts.count) {
                queryBuilder = queryBuilder.limit(opts.count);
            }
            const query = queryBuilder.toParam();
            query.text = query.text.concat(';');
            return rxjs_1.from(this.sql.query(query.text, query.values, { cache: true })).pipe(operators_1.map((result) => ({ result: 'Success', data: result }))).toPromise();
        });
    }
};
AdminStatisticsDataMapperImpl = __decorate([
    injection_js_1.Injectable(),
    __param(0, injection_js_1.Inject('IAcl')),
    __param(1, injection_js_1.Inject('IAuthService')),
    __param(2, injection_js_1.Inject('MysqlUow')),
    __param(3, injection_js_1.Inject('IPreRegisterDataMapper')),
    __param(4, injection_js_1.Inject('IRegisterDataMapper')),
    __param(5, injection_js_1.Inject('IRsvpDataMapper')),
    __param(6, injection_js_1.Inject('IScannerDataMapper')),
    __param(7, injection_js_1.Inject('IActiveHackathonDataMapper')),
    __metadata("design:paramtypes", [Object, Object, mysql_uow_service_1.MysqlUow, Object, Object, Object, Object, Object])
], AdminStatisticsDataMapperImpl);
exports.AdminStatisticsDataMapperImpl = AdminStatisticsDataMapperImpl;
//# sourceMappingURL=admin-statistics-data-mapper-impl.js.map