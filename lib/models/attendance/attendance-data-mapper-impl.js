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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var AttendanceDataMapperImpl_1;
const injection_js_1 = require("injection-js");
const lodash_1 = __importDefault(require("lodash"));
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const squel = __importStar(require("squel"));
const errors_1 = require("../../JSCommon/errors");
const auth_types_1 = require("../../services/auth/auth-types");
const generic_data_mapper_1 = require("../../services/database/svc/generic-data-mapper");
const mysql_uow_service_1 = require("../../services/database/svc/mysql-uow.service");
const logging_1 = require("../../services/logging/logging");
exports.TABLE_NAME = 'ATTENDANCE';
/**
 * TODO: Add documentation
 */
let AttendanceDataMapperImpl = AttendanceDataMapperImpl_1 = class AttendanceDataMapperImpl extends generic_data_mapper_1.GenericDataMapper {
    constructor(acl, sql, activeHackathonDataMapper, registerDataMapper, logger) {
        super(acl);
        this.sql = sql;
        this.activeHackathonDataMapper = activeHackathonDataMapper;
        this.registerDataMapper = registerDataMapper;
        this.logger = logger;
        this.CREATE = 'attendance:create';
        this.DELETE = 'attendance:delete';
        this.READ = 'attendance:read';
        this.UPDATE = 'attendance:update';
        this.READ_ALL = 'attendance:readall';
        this.COUNT = 'attendance:count';
        this.pkColumnName = 'uid';
        super.addRBAC([this.READ, this.READ_ALL], [
            auth_types_1.AuthLevel.TECHNOLOGY,
        ], undefined, [auth_types_1.AuthLevel[auth_types_1.AuthLevel.DIRECTOR]]);
    }
    get tableName() {
        return exports.TABLE_NAME;
    }
    static extractRegistrationDetails(attendanceValue) {
        return lodash_1.default.pick(attendanceValue, [
            'uid',
            'firstname',
            'lastname',
            'gender',
            'shirt_size',
            'dietary_restriction',
            'allergies',
            'travel_reimbursement',
            'first_hackathon',
            'university',
            'email',
            'academic_year',
            'major',
            'resume',
            'phone',
            'race',
            'coding_experience',
            'referral',
            'project',
            'expectations',
            'veteran',
            'pin',
            'hackathon',
        ]);
    }
    static extractEventDetails(attendanceValue) {
        return lodash_1.default.pick(attendanceValue, [
            'event_uid',
            'event_start_time',
            'event_end_time',
            'event_title',
            'event_description',
            'event_type',
        ]);
    }
    /**
     *
     * @param opts?
     * @return {Promise<Stream>}
     */
    getAll(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            let queryBuilder = squel.select({
                autoQuoteFieldNames: true,
                autoQuoteTableNames: true,
            })
                .from(this.tableName, 'attendance');
            if (opts && opts.fields) {
                queryBuilder = queryBuilder.fields(opts.fields);
            }
            if (opts && opts.startAt) {
                queryBuilder = queryBuilder.offset(opts.startAt);
            }
            if (opts && opts.count) {
                queryBuilder = queryBuilder.limit(opts.count);
            }
            if (opts && opts.byHackathon) {
                queryBuilder = queryBuilder.
                    where('hackathon_id = ?', yield (opts.hackathon ?
                    Promise.resolve(opts.hackathon) :
                    this.activeHackathonDataMapper.activeHackathon.pipe(operators_1.map(hackathon => hackathon.uid)).toPromise()));
            }
            const query = queryBuilder
                .toString()
                .concat(';');
            return rxjs_1.from(this.sql.query(query, [], { cache: true }))
                .pipe(operators_1.map((attendances) => ({
                data: attendances,
                result: 'Success',
            })))
                .toPromise();
        });
    }
    /**
     * Returns a count of the number of Attendance objects.
     */
    getCount(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            let queryBuilder = squel.select({
                autoQuoteFieldNames: false,
                autoQuoteTableNames: true,
            })
                .from(this.tableName)
                .field(`COUNT(${this.pkColumnName})`, 'count');
            if (opts && opts.byHackathon) {
                queryBuilder = queryBuilder.
                    where('hackathon_id = ?', yield (opts.hackathon ?
                    Promise.resolve(opts.hackathon) :
                    this.activeHackathonDataMapper.activeHackathon.pipe(operators_1.map(hackathon => hackathon.uid)).toPromise()));
            }
            const query = queryBuilder
                .toString()
                .concat(';');
            return rxjs_1.from(this.sql.query(query, [], { cache: true })).pipe(operators_1.map((result) => ({ result: 'Success', data: result[0] }))).toPromise();
        });
    }
    getAttendanceByUser(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            let queryBuilder = squel.select({
                autoQuoteFieldNames: true,
                autoQuoteTableNames: true,
            })
                .from(this.tableName, 'attendance')
                .join(this.registerDataMapper.tableName, 'registration', 'attendance.user_uid = registration.uid')
                .distinct();
            if (opts && opts.fields) {
                queryBuilder = queryBuilder.fields(opts.fields);
            }
            if (opts && opts.startAt) {
                queryBuilder = queryBuilder.offset(opts.startAt);
            }
            if (opts && opts.count) {
                queryBuilder = queryBuilder.limit(opts.count);
            }
            if (opts && opts.byHackathon) {
                queryBuilder = queryBuilder.where('hackathon_id = ?', yield (opts.hackathon ?
                    Promise.resolve(opts.hackathon) :
                    this.activeHackathonDataMapper.activeHackathon.pipe(operators_1.map(hackathon => hackathon.uid))
                        .toPromise()));
                queryBuilder = queryBuilder.where('registration.hackathon = ?', yield (opts.hackathon ?
                    Promise.resolve(opts.hackathon) :
                    this.activeHackathonDataMapper.activeHackathon.pipe(operators_1.map(hackathon => hackathon.uid))
                        .toPromise()));
            }
            if (opts && opts.uid) {
                queryBuilder = queryBuilder.where('attendance.user_uid = ?', opts.uid);
            }
            const query = queryBuilder
                .order('event_start_time')
                .toParam();
            query.text = query.text.concat(';');
            return rxjs_1.from(this.sql.query(query.text, query.values, { cache: true })).pipe(operators_1.map((result) => {
                // Reduce the result to a condensed object
                return result.reduce((currentAggregation, nextAttendance) => {
                    if (currentAggregation[nextAttendance.user_uid]) {
                        currentAggregation[nextAttendance.user_uid].events
                            .push(AttendanceDataMapperImpl_1.extractEventDetails(nextAttendance));
                    }
                    else {
                        currentAggregation[nextAttendance.user_uid] = Object.assign({}, AttendanceDataMapperImpl_1.extractRegistrationDetails(nextAttendance), { events: [AttendanceDataMapperImpl_1.extractEventDetails(nextAttendance)] });
                    }
                    return currentAggregation;
                }, {});
            }), operators_1.map((result) => ({ result: 'Success', data: result }))).toPromise();
        });
    }
    getAttendanceByEvent(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            let queryBuilder = squel.select({
                autoQuoteFieldNames: true,
                autoQuoteTableNames: true,
            })
                .from(this.tableName, 'attendance')
                .join(this.registerDataMapper.tableName, 'registration', 'attendance.user_uid = registration.uid')
                .distinct();
            if (opts && opts.fields) {
                queryBuilder = queryBuilder.fields(opts.fields);
            }
            if (opts && opts.startAt) {
                queryBuilder = queryBuilder.offset(opts.startAt);
            }
            if (opts && opts.count) {
                queryBuilder = queryBuilder.limit(opts.count);
            }
            if (opts && opts.byHackathon) {
                queryBuilder = queryBuilder.where('hackathon_id = ?', yield (opts.hackathon ?
                    Promise.resolve(opts.hackathon) :
                    this.activeHackathonDataMapper.activeHackathon.pipe(operators_1.map(hackathon => hackathon.uid))
                        .toPromise()));
                queryBuilder = queryBuilder.where('registration.hackathon = ?', yield (opts.hackathon ?
                    Promise.resolve(opts.hackathon) :
                    this.activeHackathonDataMapper.activeHackathon.pipe(operators_1.map(hackathon => hackathon.uid))
                        .toPromise()));
            }
            if (opts && opts.uid) {
                queryBuilder = queryBuilder.where('attendance.event_uid = ?', opts.uid);
            }
            const query = queryBuilder
                .toParam();
            query.text = query.text.concat(';');
            return rxjs_1.from(this.sql.query(query.text, query.values, { cache: true })).pipe(operators_1.map((result) => {
                // Reduce the result to a condensed object
                return result.reduce((currentAggregation, nextAttendance) => {
                    if (currentAggregation[nextAttendance.event_uid]) {
                        currentAggregation[nextAttendance.event_uid].attendees
                            .push(AttendanceDataMapperImpl_1.extractRegistrationDetails(nextAttendance));
                    }
                    else {
                        currentAggregation[nextAttendance.event_uid] = Object.assign({}, AttendanceDataMapperImpl_1.extractEventDetails(nextAttendance), { attendees: [AttendanceDataMapperImpl_1.extractRegistrationDetails(nextAttendance)] });
                    }
                    return currentAggregation;
                }, {});
            }), operators_1.map((result) => ({ result: 'Success', data: result }))).toPromise();
        });
    }
    get(uid, opts) {
        throw new errors_1.MethodNotImplementedError('This method is not supported by this class');
    }
    insert(object, opts) {
        throw new errors_1.MethodNotImplementedError('This method is not supported by this class');
    }
    update(object, opts) {
        throw new errors_1.MethodNotImplementedError('This method is not supported by this class');
    }
    delete(uid, opts) {
        throw new errors_1.MethodNotImplementedError('This method is not supported by this class');
    }
};
AttendanceDataMapperImpl = AttendanceDataMapperImpl_1 = __decorate([
    injection_js_1.Injectable(),
    __param(0, injection_js_1.Inject('IAcl')),
    __param(1, injection_js_1.Inject('MysqlUow')),
    __param(2, injection_js_1.Inject('IActiveHackathonDataMapper')),
    __param(3, injection_js_1.Inject('IRegisterDataMapper')),
    __param(4, injection_js_1.Inject('BunyanLogger')),
    __metadata("design:paramtypes", [Object, mysql_uow_service_1.MysqlUow, Object, Object, logging_1.Logger])
], AttendanceDataMapperImpl);
exports.AttendanceDataMapperImpl = AttendanceDataMapperImpl;
//# sourceMappingURL=attendance-data-mapper-impl.js.map