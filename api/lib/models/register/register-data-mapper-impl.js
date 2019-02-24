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
const errors_1 = require("../../JSCommon/errors");
const auth_types_1 = require("../../services/auth/auth-types");
const generic_data_mapper_1 = require("../../services/database/svc/generic-data-mapper");
const mysql_uow_service_1 = require("../../services/database/svc/mysql-uow.service");
const logging_1 = require("../../services/logging/logging");
let RegisterDataMapperImpl = class RegisterDataMapperImpl extends generic_data_mapper_1.GenericDataMapper {
    constructor(acl, sql, activeHackathonDataMapper, logger) {
        super(acl);
        this.sql = sql;
        this.activeHackathonDataMapper = activeHackathonDataMapper;
        this.logger = logger;
        this.CREATE = 'registration:create';
        this.DELETE = 'registration:delete';
        this.READ = 'registration:read';
        this.READ_ALL = 'registration:readall';
        this.UPDATE = 'registration:update';
        this.COUNT = 'registration:count';
        this.tableName = 'REGISTRATION';
        this.pkColumnName = 'uid';
        super.addRBAC([this.DELETE], [auth_types_1.AuthLevel.DIRECTOR], undefined, [auth_types_1.AuthLevel[auth_types_1.AuthLevel.TEAM_MEMBER]]);
        super.addRBAC([this.READ_ALL, this.COUNT], [auth_types_1.AuthLevel.VOLUNTEER], undefined, [auth_types_1.AuthLevel[auth_types_1.AuthLevel.PARTICIPANT]]);
        super.addRBAC([this.READ, this.UPDATE, this.CREATE], [auth_types_1.AuthLevel.PARTICIPANT]);
    }
    delete(id) {
        const query = squel.delete({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
            .from(this.tableName)
            .where(`${this.pkColumnName} = ?`, id.uid)
            .where('hackathon = ?', id.hackathon)
            .toParam();
        query.text = query.text.concat(';');
        return rxjs_1.from(this.sql.query(query.text, query.values, { cache: false })).pipe(operators_1.map(() => ({ result: 'Success', data: undefined }))).toPromise();
    }
    get(id, opts) {
        let queryBuilder = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
            .from(this.tableName);
        if (opts && opts.fields) {
            queryBuilder = queryBuilder.fields(opts.fields);
        }
        queryBuilder = queryBuilder
            .where(`${this.pkColumnName}= ?`, id.uid)
            .where('hackathon = ?', id.hackathon)
            .order('time', false);
        const query = queryBuilder.toParam();
        query.text = query.text.concat(';');
        return rxjs_1.from(this.sql.query(query.text, query.values, { cache: true }))
            .pipe(operators_1.map((event) => ({ result: 'Success', data: event[0] })), operators_1.map((value) => {
            value.data.time = parseInt(value.data.time, 10);
            return value;
        }))
            .toPromise();
    }
    getAll(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            let queryBuilder = squel.select({
                autoQuoteFieldNames: true,
                autoQuoteTableNames: true,
            })
                .from(this.tableName, 'registration')
                .join(this.activeHackathonDataMapper.tableName, 'hackathon', 'registration.hackathon = hackathon.uid');
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
                queryBuilder = queryBuilder
                    .where('hackathon.uid = ?', yield (opts.hackathon ?
                    Promise.resolve(opts.hackathon) :
                    this.activeHackathonDataMapper.activeHackathon
                        .pipe(operators_1.map(hackathon => hackathon.uid))
                        .toPromise()));
            }
            const query = queryBuilder
                .toParam();
            query.text = query.text.concat(';');
            return rxjs_1.from(this.sql.query(query.text, query.values, { cache: true }))
                .pipe(operators_1.map((registrations) => ({ result: 'Success', data: registrations })))
                .toPromise();
        });
    }
    getCount(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = (yield this.getCountQuery(opts)).toParam();
            query.text = query.text.concat(';');
            return rxjs_1.from(this.sql.query(query.text, query.values, { cache: true })).pipe(operators_1.map((result) => ({ result: 'Success', data: result[0] }))).toPromise();
        });
    }
    getCountQuery(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            let queryBuilder = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: false })
                .from(this.tableName)
                .field(`COUNT(${this.pkColumnName})`, 'registration_count');
            if (opts && opts.byHackathon) {
                queryBuilder = queryBuilder
                    .where('hackathon = ?', yield (opts.hackathon ?
                    Promise.resolve(opts.hackathon) :
                    this.activeHackathonDataMapper.activeHackathon
                        .pipe(operators_1.map(hackathon => hackathon.uid))
                        .toPromise()));
            }
            return queryBuilder;
        });
    }
    insert(object) {
        return __awaiter(this, void 0, void 0, function* () {
            const validation = object.validate();
            if (!validation.result) {
                this.logger.warn('Validation failed while adding object.');
                this.logger.warn(object.dbRepresentation);
                throw new errors_1.HttpError(validation.error, 400);
            }
            let queryBuilder = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
                .into(this.tableName)
                .setFieldsRows([object.dbRepresentation])
                .set('hackathon', yield this.activeHackathonDataMapper.activeHackathon.pipe(operators_1.map(hackathon => hackathon.uid))
                .toPromise());
            if (!object.time) {
                queryBuilder = queryBuilder
                    .set('time', Date.now());
            }
            const query = queryBuilder
                .toParam();
            query.text = query.text.concat(';');
            return rxjs_1.from(this.sql.query(query.text, query.values, { cache: false })).pipe(operators_1.map(() => ({ result: 'Success', data: object.cleanRepresentation }))).toPromise();
        });
    }
    submit(object) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = squel.update({
                autoQuoteFieldNames: true,
                autoQuoteTableNames: true,
            })
                .table(this.tableName)
                .set('submitted', true)
                .where('uid = ?', object.id)
                .where('hackathon = ?', yield this.activeHackathonDataMapper.activeHackathon
                .pipe(operators_1.map(hackathon => hackathon.uid))
                .toPromise())
                .toParam();
            query.text = query.text.concat(';');
            return rxjs_1.from(this.sql.query(query.text, query.values, { cache: false })).pipe(operators_1.map(() => ({ result: 'Success', data: true }))).toPromise();
        });
    }
    update(object) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentDbObject = yield this.get({ uid: object.id, hackathon: object.hackathon });
            const currentObject = object.merge(object, currentDbObject.data);
            const validation = currentObject.validate();
            if (!validation.result) {
                this.logger.warn('Validation failed while updating object.');
                this.logger.warn(currentObject.dbRepresentation);
                throw new errors_1.HttpError(validation.error, 400);
            }
            const query = squel.update({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
                .table(this.tableName)
                .setFields(currentObject.dbRepresentation)
                .where(`${this.pkColumnName} = ?`, currentObject.id)
                .where('hackathon = ?', currentObject.hackathon)
                .toParam();
            query.text = query.text.concat(';');
            return rxjs_1.from(this.sql.query(query.text, query.values, { cache: false })).pipe(operators_1.map(() => ({ result: 'Success', data: currentObject.cleanRepresentation }))).toPromise();
        });
    }
    getCurrent(id, opts) {
        let queryBuilder = squel.select({ autoQuoteFieldNames: false, autoQuoteTableNames: true })
            .from(this.tableName, 'registration');
        queryBuilder = opts && opts.fields ?
            queryBuilder.fields(opts.fields) :
            queryBuilder.field('registration.*');
        const query = queryBuilder
            .field('registration.pin - hackathon.base_pin', 'pin')
            .where(`registration.${this.pkColumnName}= ?`, id)
            .join(this.activeHackathonDataMapper.tableName, 'hackathon', 'registration.hackathon = hackathon.uid and hackathon.active = 1')
            .toParam();
        query.text = query.text.concat(';');
        return rxjs_1.from(this.sql.query(query.text, query.values, { cache: true }))
            .pipe(operators_1.map((event) => ({ result: 'Success', data: event[0] })))
            .toPromise();
    }
    getRegistrationStats(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const columnNames = [
                'academic_year',
                'coding_experience',
                'dietary_restriction',
                'travel_reimbursement',
                'race',
                'shirt_size',
                'gender',
                'first_hackathon',
                'veteran',
            ];
            let queryBuilder;
            // tslint:disable-next-line:prefer-for-of
            for (let i = 0; i < columnNames.length; i += 1) {
                queryBuilder = !queryBuilder ?
                    yield this.getSelectQueryForOptionName(columnNames[i], opts) :
                    queryBuilder.union(yield this.getSelectQueryForOptionName(columnNames[i], opts));
            }
            const query = queryBuilder.toParam();
            query.text = query.text.concat(';');
            return rxjs_1.from(this.sql.query(query.text, query.values, { cache: true }))
                .pipe(operators_1.map((event) => ({ result: 'Success', data: event })))
                .toPromise();
        });
    }
    getEmailByUid(uid) {
        const query = squel.select({
            autoQuoteFieldNames: true,
            autoQuoteTableNames: true,
        })
            .from(this.tableName)
            .field('email')
            .where('uid = ?', uid)
            .toParam();
        query.text = query.text.concat(';');
        return rxjs_1.from(this.sql.query(query.text, query.values, { cache: true }))
            .pipe(operators_1.map((email) => ({ result: 'Success', data: email })))
            .toPromise();
    }
    /**
     * Returns a generated query for counting the statistics for
     * a given table column
     */
    getSelectQueryForOptionName(fieldname, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            let queryBuilder = squel.select({
                autoQuoteFieldNames: false,
                autoQuoteTableNames: true,
            })
                .from(this.tableName)
                .field(`"${fieldname}"`, 'CATEGORY')
                .field(fieldname, 'OPTION')
                .field('COUNT(*)', 'COUNT');
            if (opts && opts.byHackathon) {
                queryBuilder = queryBuilder
                    .join(this.activeHackathonDataMapper.tableName, 'hackathon', `hackathon.uid = ${this.tableName}.hackathon`)
                    .where('hackathon.uid = ?', yield (opts.hackathon ?
                    Promise.resolve(opts.hackathon) :
                    this.activeHackathonDataMapper.activeHackathon
                        .pipe(operators_1.map(hackathon => hackathon.uid))
                        .toPromise()));
            }
            return queryBuilder.group(fieldname);
        });
    }
};
RegisterDataMapperImpl = __decorate([
    injection_js_1.Injectable(),
    __param(0, injection_js_1.Inject('IAcl')),
    __param(1, injection_js_1.Inject('MysqlUow')),
    __param(2, injection_js_1.Inject('IActiveHackathonDataMapper')),
    __param(3, injection_js_1.Inject('BunyanLogger')),
    __metadata("design:paramtypes", [Object, mysql_uow_service_1.MysqlUow, Object, logging_1.Logger])
], RegisterDataMapperImpl);
exports.RegisterDataMapperImpl = RegisterDataMapperImpl;
//# sourceMappingURL=register-data-mapper-impl.js.map