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
var ScannerDataMapperImpl_1;
const injection_js_1 = require("injection-js");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const squel_1 = __importDefault(require("squel"));
const errors_1 = require("../../JSCommon/errors");
const auth_types_1 = require("../../services/auth/auth-types");
const generic_data_mapper_1 = require("../../services/database/svc/generic-data-mapper");
const mysql_uow_service_1 = require("../../services/database/svc/mysql-uow.service");
const logging_1 = require("../../services/logging/logging");
let ScannerDataMapperImpl = ScannerDataMapperImpl_1 = class ScannerDataMapperImpl extends generic_data_mapper_1.GenericDataMapper {
    constructor(acl, sql, activeHackathonDataMapper, logger) {
        super(acl);
        this.sql = sql;
        this.activeHackathonDataMapper = activeHackathonDataMapper;
        this.logger = logger;
        this.COUNT = 'rfidassignment:count';
        this.CREATE = 'rfidassignment:create';
        this.READ_ALL = 'rfidassignment:readall';
        this.UPDATE = 'rfidassignment:update';
        this.tableName = 'RFID_ASSIGNMENTS';
        this.scansTableName = 'SCANS';
        this.pkColumnName = 'rfid_uid';
        super.addRBAC([this.CREATE, this.UPDATE, this.COUNT, this.READ_ALL], [auth_types_1.AuthLevel.TEAM_MEMBER], undefined, [auth_types_1.AuthLevel[auth_types_1.AuthLevel.VOLUNTEER]]);
    }
    static handleInsertionError(error, object) {
        switch (error.status) {
            case 400:
                return { result: 'Bad input', data: object.cleanRepresentation };
            case 409:
                return {
                    data: object.cleanRepresentation,
                    result: 'Duplicate detected',
                };
            default:
                return {
                    data: object.cleanRepresentation,
                    result: 'Error',
                };
        }
    }
    delete(object) {
        throw new errors_1.MethodNotImplementedError('This method is not supported by this class');
    }
    /**
     * Returns an RFID assignment object from a wid
     */
    get(wid, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            let queryBuilder = squel_1.default.select({
                autoQuoteFieldNames: true,
                autoQuoteTableNames: true,
            })
                .from(this.tableName);
            if (opts && opts.fields) {
                queryBuilder = queryBuilder.fields(opts.fields);
            }
            if (opts && opts.byHackathon) {
                queryBuilder = queryBuilder
                    .where('hackathon = ?', yield (opts.hackathon ?
                    Promise.resolve(opts.hackathon) :
                    this.activeHackathonDataMapper.activeHackathon
                        .pipe(operators_1.map(hackathon => hackathon.uid))
                        .toPromise()));
            }
            queryBuilder = queryBuilder
                .where(`${this.pkColumnName}= ?`, wid.uid);
            const query = queryBuilder.toParam();
            query.text = query.text.concat(';');
            return rxjs_1.from(this.sql.query(query.text, query.values, { cache: true }))
                .pipe(operators_1.map((rfidAssignment) => ({ result: 'Success', data: rfidAssignment[0] })))
                .toPromise();
        });
    }
    getAll(opts) {
        throw new errors_1.MethodNotImplementedError('this action is not supported');
    }
    getCount(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = (yield this.getCountQuery(opts))
                .toParam();
            query.text = query.text.concat(';');
            return rxjs_1.from(this.sql.query(query.text, query.values, { cache: true })).pipe(operators_1.map((result) => ({ result: 'Success', data: result[0] }))).toPromise();
        });
    }
    insert(object) {
        return __awaiter(this, void 0, void 0, function* () {
            const validation = object.validate();
            if (!validation.result) {
                this.logger.warn('Validation failed while adding object.');
                this.logger.warn(object.dbRepresentation);
                return Promise.reject(new errors_1.HttpError(validation.error, 400));
            }
            const query = squel_1.default.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
                .into(this.tableName)
                .setFields(object.dbRepresentation)
                .set('hackathon', yield this.activeHackathonDataMapper.activeHackathon.pipe(operators_1.map(hackathon => hackathon.uid))
                .toPromise())
                .toParam();
            query.text = query.text.concat(';');
            return rxjs_1.from(this.sql.query(query.text, query.values, { cache: false })).pipe(operators_1.map(() => ({ result: 'Success', data: object.cleanRepresentation }))).toPromise();
        });
    }
    update(object) {
        throw new errors_1.MethodNotImplementedError('This method is not supported by this class');
    }
    addRfidAssignments(assignments) {
        return __awaiter(this, void 0, void 0, function* () {
            let resultString = 'Success';
            const result = yield Promise.all(assignments.map(
            // Handle any insertion errors here and
            // change return an IDbResult with result: error
            (assignment, index) => __awaiter(this, void 0, void 0, function* () {
                try {
                    return yield this.insert(assignment);
                }
                catch (error) {
                    resultString = 'Error';
                    return ScannerDataMapperImpl_1.handleInsertionError(error, assignment[index]);
                }
            })));
            return {
                data: result,
                result: resultString,
            };
        });
    }
    addScans(scans) {
        return Promise.all(scans.map(scan => this.addSingleScan(scan).catch(error => error)));
    }
    addSingleScan(scan) {
        const validation = scan.validate();
        if (!validation.result) {
            this.logger.warn('Validation failed while adding object.');
            this.logger.warn(scan.dbRepresentation);
            return Promise.reject({ result: 'error', data: new errors_1.HttpError(validation.error, 400) });
        }
        const query = squel_1.default.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
            .into(this.scansTableName)
            .setFields(scan.dbRepresentation)
            .toParam();
        query.text = query.text.concat(';');
        return rxjs_1.from(this.sql.query(query.text, query.values, { cache: false })).pipe(operators_1.map(() => ({ result: 'Success', data: scan.cleanRepresentation }))).toPromise();
    }
    getCountQuery(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            let queryBuilder = squel_1.default.select({ autoQuoteTableNames: true, autoQuoteFieldNames: false })
                .from(this.tableName)
                .field(`COUNT(${this.pkColumnName})`, 'checkin_count');
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
};
ScannerDataMapperImpl = ScannerDataMapperImpl_1 = __decorate([
    injection_js_1.Injectable(),
    __param(0, injection_js_1.Inject('IAcl')),
    __param(1, injection_js_1.Inject('MysqlUow')),
    __param(2, injection_js_1.Inject('IActiveHackathonDataMapper')),
    __param(3, injection_js_1.Inject('BunyanLogger')),
    __metadata("design:paramtypes", [Object, mysql_uow_service_1.MysqlUow, Object, logging_1.Logger])
], ScannerDataMapperImpl);
exports.ScannerDataMapperImpl = ScannerDataMapperImpl;
//# sourceMappingURL=scanner-data-mapper-impl.js.map