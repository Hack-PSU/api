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
/**
 * TODO: Change 'CHECKOUT_DATA' to reference the checkoutObjectDataMapper and add documentation
 */
let CheckoutItemsDataMapperImpl = class CheckoutItemsDataMapperImpl extends generic_data_mapper_1.GenericDataMapper {
    constructor(acl, sql, activeHackathonDataMapper, logger) {
        super(acl);
        this.sql = sql;
        this.activeHackathonDataMapper = activeHackathonDataMapper;
        this.logger = logger;
        this.COUNT = 'checkoutItemss:count';
        this.CREATE = 'checkoutItems:create';
        this.DELETE = 'checkoutItems:delete';
        this.READ = 'checkoutItems:read';
        this.READ_ALL = 'checkoutItems:readall';
        this.UPDATE = 'checkoutItems:update';
        this.tableName = 'CHECKOUT_ITEMS';
        this.pkColumnName = 'uid';
        super.addRBAC([this.READ, this.READ_ALL, this.CREATE, this.UPDATE, this.DELETE], [auth_types_1.AuthLevel.TEAM_MEMBER], undefined, [auth_types_1.AuthLevel[auth_types_1.AuthLevel.VOLUNTEER]]);
    }
    delete(id) {
        const query = squel.delete({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
            .from(this.tableName)
            .where(`${this.pkColumnName} = ?`, id)
            .toParam();
        query.text = query.text.concat(';');
        return rxjs_1.from(this.sql.query(query.text, query.values, { cache: false })).pipe(operators_1.map(() => ({ result: 'Success', data: undefined }))).toPromise();
    }
    get(id, opts) {
        let queryBuilder = squel.select({
            autoQuoteFieldNames: true,
            autoQuoteTableNames: true,
        })
            .from(this.tableName);
        if (opts && opts.fields) {
            queryBuilder = queryBuilder.fields(opts.fields);
        }
        queryBuilder = queryBuilder
            .where(`${this.pkColumnName}= ?`, id);
        const query = queryBuilder.toParam();
        query.text = query.text.concat(';');
        return rxjs_1.from(this.sql.query(query.text, query.values, { cache: true }))
            .pipe(operators_1.map((checkoutItems) => ({ result: 'Success', data: checkoutItems[0] })))
            .toPromise();
    }
    getAll(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            let queryBuilder = squel.select({
                autoQuoteFieldNames: true,
                autoQuoteTableNames: true,
            })
                .from(this.tableName, 'checkoutItems');
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
                .pipe(operators_1.map((checkoutItems) => ({ result: 'Success', data: checkoutItems })))
                .toPromise();
        });
    }
    getAvailable(id) {
        const query = squel.select({
            autoQuoteFieldNames: false,
            autoQuoteTableNames: true,
        })
            .fields(['i.quantity - COUNT(c.uid) AS available', 'i.*'])
            .from('CHECKOUT_DATA', 'c')
            .join(this.tableName, 'i', 'c.item_id=i.uid')
            .join(this.activeHackathonDataMapper.tableName, 'h', 'c.hackathon=h.uid and h.active=1')
            .where('c.uid=?', id)
            .toParam();
        query.text = query.text.concat(';');
        return rxjs_1.from(this.sql.query(query.text, query.values, { cache: true }))
            .pipe(operators_1.map((checkoutItems) => ({
            data: checkoutItems[0],
            result: 'Success',
        })))
            .toPromise();
    }
    getAllAvailable() {
        return __awaiter(this, void 0, void 0, function* () {
            const subquery = squel.select({
                autoQuoteFieldNames: false,
                autoQuoteTableNames: false,
            })
                .from('CHECKOUT_DATA', 'c') // Here
                .field('COUNT(uid)')
                .where('c.item_id=i.uid')
                .toString();
            const query = squel.select({
                autoQuoteFieldNames: false,
                autoQuoteTableNames: true,
            })
                .fields([`i.quantity - (${subquery}) AS available`, 'i.*'])
                .from(this.tableName, 'i')
                .left_join('CHECKOUT_DATA', 'c', 'c.item_id=i.uid') // Here
                .left_join(this.activeHackathonDataMapper.tableName, 'h', 'c.hackathon=h.uid and h.active=1')
                .group('i.uid')
                .toParam();
            query.text = query.text.concat(';');
            return rxjs_1.from(this.sql.query(query.text, [], { cache: true }))
                .pipe(operators_1.map((checkoutItems) => ({
                data: checkoutItems,
                result: 'Success',
            })))
                .toPromise();
        });
    }
    /**
     * Returns a count of the number of CheckoutItems objects.
     * @returns {Promise<Readable>}
     */
    getCount(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = squel.select({
                autoQuoteFieldNames: false,
                autoQuoteTableNames: true,
            })
                .from(this.tableName)
                .field(`COUNT(${this.pkColumnName})`, 'count')
                .toString()
                .concat(';');
            return rxjs_1.from(this.sql.query(query, [], { cache: true })).pipe(operators_1.map((result) => ({ result: 'Success', data: result[0] }))).toPromise();
        });
    }
    insert(object) {
        const validation = object.validate();
        if (!validation.result) {
            this.logger.warn('Validation failed while adding object.');
            this.logger.warn(object.dbRepresentation);
            return Promise.reject({ result: 'error', data: new errors_1.HttpError(validation.error, 400) });
        }
        const query = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
            .into(this.tableName)
            .setFieldsRows([object.dbRepresentation])
            .toParam();
        query.text = query.text.concat(';');
        return rxjs_1.from(this.sql.query(query.text, query.values, { cache: false })).pipe(operators_1.map(() => ({ result: 'Success', data: object.cleanRepresentation }))).toPromise();
    }
    update(object) {
        const validation = object.validate();
        if (!validation.result) {
            this.logger.warn('Validation failed while adding object.');
            this.logger.warn(object.dbRepresentation);
            return Promise.reject({ result: 'error', data: new errors_1.HttpError(validation.error, 400) });
        }
        const query = squel.update({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
            .table(this.tableName)
            .setFields(object.dbRepresentation)
            .where(`${this.pkColumnName} = ?`, object.id)
            .toParam();
        query.text = query.text.concat(';');
        return rxjs_1.from(this.sql.query(query.text, query.values, { cache: false })).pipe(operators_1.map(() => ({ result: 'Success', data: object.cleanRepresentation }))).toPromise();
    }
};
CheckoutItemsDataMapperImpl = __decorate([
    injection_js_1.Injectable(),
    __param(0, injection_js_1.Inject('IAcl')),
    __param(1, injection_js_1.Inject('MysqlUow')),
    __param(2, injection_js_1.Inject('IActiveHackathonDataMapper')),
    __param(3, injection_js_1.Inject('BunyanLogger')),
    __metadata("design:paramtypes", [Object, mysql_uow_service_1.MysqlUow, Object, logging_1.Logger])
], CheckoutItemsDataMapperImpl);
exports.CheckoutItemsDataMapperImpl = CheckoutItemsDataMapperImpl;
//# sourceMappingURL=checkout-items-data-mapper-impl.js.map