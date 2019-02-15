import { Inject, Injectable } from 'injection-js';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import * as squel from 'squel';
import { Stream } from 'ts-stream';
import { UidType } from '../../JSCommon/common-types';
import { HttpError } from '../../JSCommon/errors';
import { AuthLevel } from '../../services/auth/auth-types';
import { IAcl, IAclPerm } from '../../services/auth/RBAC/rbac-types';
import { IDbResult } from '../../services/database';
import { GenericDataMapper } from '../../services/database/svc/generic-data-mapper';
import { MysqlUow } from '../../services/database/svc/mysql-uow.service';
import { IUowOpts } from '../../services/database/svc/uow.service';
import { Logger } from '../../services/logging/logging';
import { IActiveHackathonDataMapper } from '../hackathon/active-hackathon';
import { CheckoutItems } from './checkout-items';
import { ICheckoutItemsDataMapper } from './index';

/**
 * TODO: Change 'CHECKOUT_DATA' to reference the checkoutObjectDataMapper and add documentation
 */

@Injectable()
export class CheckoutItemsDataMapperImpl extends GenericDataMapper
  implements IAclPerm, ICheckoutItemsDataMapper {
  public readonly COUNT: string = 'checkoutItemss:count';
  public readonly CREATE: string = 'checkoutItems:create';
  public readonly DELETE: string = 'checkoutItems:delete';
  public readonly READ: string = 'checkoutItems:read';
  public readonly READ_ALL: string = 'checkoutItems:readall';
  public readonly UPDATE: string = 'checkoutItems:update';

  public tableName = 'CHECKOUT_ITEMS';

  protected pkColumnName: string = 'uid';

  constructor(
    @Inject('IAcl') acl: IAcl,
    @Inject('MysqlUow') protected readonly sql: MysqlUow,
    @Inject('IActiveHackathonDataMapper') protected readonly activeHackathonDataMapper: IActiveHackathonDataMapper,
    @Inject('BunyanLogger') protected readonly logger: Logger,
  ) {
    super(acl);
    super.addRBAC(
      [this.READ, this.READ_ALL, this.CREATE, this.UPDATE, this.DELETE],
      [AuthLevel.TEAM_MEMBER],
      undefined,
      [AuthLevel[AuthLevel.VOLUNTEER]],
    );
  }
  public delete(id: UidType): Promise<IDbResult<void>> {
    const query = squel.delete({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from(this.tableName)
      .where(`${this.pkColumnName} = ?`, id)
      .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query(query.text, query.values, { stream: false, cache: false }),
    ).pipe(
      map(() => ({ result: 'Success', data: undefined })),
    ).toPromise();
  }

  public get(id: UidType, opts?: IUowOpts): Promise<IDbResult<CheckoutItems>> {
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
    return from(this.sql.query<CheckoutItems>(query.text, query.values, { stream: false, cache: true }))
      .pipe(
        map((checkoutItems: CheckoutItems[]) => ({ result: 'Success', data: checkoutItems[0] })),
      )
      .toPromise();
  }

  public async getAll(opts?: IUowOpts): Promise<IDbResult<Stream<CheckoutItems>>> {
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
            where(
              'hackathon_id = ?',
              await (opts.hackathon ?
                Promise.resolve(opts.hackathon) :
                this.activeHackathonDataMapper.activeHackathon.pipe(map(hackathon => hackathon.uid)).toPromise()),
            );
    }
    const query = queryBuilder
        .toString()
        .concat(';');
    return from(this.sql.query<CheckoutItems>(query, [], { stream: true, cache: true }))
        .pipe(
          map((checkoutItemsStream: Stream<CheckoutItems>) => ({ result: 'Success', data: checkoutItemsStream })),
        )
        .toPromise();
  }

  public getAvailable(id: number): Promise<IDbResult<CheckoutItems>> {
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
    return from(
      this.sql.query<CheckoutItems>(query.text, query.values, { stream: false, cache: true }))
      .pipe(
        map((checkoutItems: CheckoutItems[]) => ({
          data: checkoutItems[0],
          result: 'Success',
        })),
      )
      .toPromise();
  }

  public async getAllAvailable(): Promise<IDbResult<Stream<CheckoutItems>>> {
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
    return from(
      this.sql.query<CheckoutItems>(query.text, [], { stream: true, cache: true }))
      .pipe(
        map((checkoutItemsStream: Stream<CheckoutItems>) => ({
          data: checkoutItemsStream,
          result: 'Success',
        })),
      )
      .toPromise();
  }

  /**
   * Returns a count of the number of CheckoutItems objects.
   * @returns {Promise<Readable>}
   */
  public async getCount(opts?: IUowOpts): Promise<IDbResult<number>> {
    const query = squel.select({
      autoQuoteFieldNames: false,
      autoQuoteTableNames: true,
    })
      .from(this.tableName)
      .field(`COUNT(${this.pkColumnName})`, 'count')
      .toString()
      .concat(';');
    return from(
      this.sql.query<number>(query, [], { stream: true, cache: true }),
    ).pipe(
      map((result: number[]) => ({ result: 'Success', data: result[0] })),
    ).toPromise();
  }

  public insert(object: CheckoutItems): Promise<IDbResult<CheckoutItems>> {
    const validation = object.validate();
    if (!validation.result) {
      this.logger.warn('Validation failed while adding object.');
      this.logger.warn(object.dbRepresentation);
      return Promise.reject({ result: 'error', data: new HttpError(validation.error, 400) });
    }
    const query = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(this.tableName)
      .setFieldsRows([object.dbRepresentation])
      .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query<void>(query.text, query.values, { stream: false, cache: false }),
    ).pipe(
      map(() => ({ result: 'Success', data: object.cleanRepresentation })),
    ).toPromise();
  }

  public update(object: CheckoutItems): Promise<IDbResult<CheckoutItems>> {
    const validation = object.validate();
    if (!validation.result) {
      this.logger.warn('Validation failed while adding object.');
      this.logger.warn(object.dbRepresentation);
      return Promise.reject({ result: 'error', data: new HttpError(validation.error, 400) });
    }
    const query = squel.update({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .table(this.tableName)
      .setFields(object.dbRepresentation)
      .where(`${this.pkColumnName} = ?`, object.id)
      .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query<void>(query.text, query.values, { stream: false, cache: false }),
    ).pipe(
      map(() => ({ result: 'Success', data: object.cleanRepresentation })),
    ).toPromise();
  }
}
