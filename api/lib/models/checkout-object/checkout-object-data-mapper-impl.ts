import { Inject, Injectable } from 'injection-js';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import * as squel from 'squel';
import { EpochNumber, ICompoundHackathonUidType } from '../../JSCommon/common-types';
import { HttpError } from '../../JSCommon/errors';
import { AuthLevel } from '../../services/auth/auth-types';
import { IAcl, IAclPerm } from '../../services/auth/RBAC/rbac-types';
import { IDbResult } from '../../services/database';
import { GenericDataMapper } from '../../services/database/svc/generic-data-mapper';
import { MysqlUow } from '../../services/database/svc/mysql-uow.service';
import { IUowOpts } from '../../services/database/svc/uow.service';
import { Logger } from '../../services/logging/logging';
import { IActiveHackathonDataMapper } from '../hackathon/active-hackathon';
import { CheckoutObject } from './checkout-object';
import { ICheckoutObjectDataMapper } from './index';

@Injectable()
export class CheckoutObjectDataMapperImpl extends GenericDataMapper
  implements IAclPerm, ICheckoutObjectDataMapper {
  public readonly COUNT: string = 'checkoutObjects:count';
  public readonly CREATE: string = 'checkoutObject:create';
  public readonly DELETE: string = 'checkoutObject:delete';
  public readonly READ: string = 'checkoutObject:read';
  public readonly READ_ALL: string = 'checkoutObject:readall';
  public readonly UPDATE: string = 'checkoutObject:update';

  public tableName = 'CHECKOUT_DATA';

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

  public delete(id: ICompoundHackathonUidType): Promise<IDbResult<void>> {
    const query = squel.delete({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from(this.tableName)
      .where(`${this.pkColumnName} = ?`, id.uid)
      .where('hackathon = ?', id.hackathon)
      .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query(query.text, query.values, { cache: false }),
    ).pipe(
      map(() => ({ result: 'Success', data: undefined })),
    ).toPromise();
  }

  public get(id: ICompoundHackathonUidType, opts?: IUowOpts): Promise<IDbResult<CheckoutObject>> {
    let queryBuilder = squel.select({
      autoQuoteFieldNames: true,
      autoQuoteTableNames: true,
    })
      .from(this.tableName);
    if (opts && opts.fields) {
      queryBuilder = queryBuilder.fields(opts.fields);
    }
    queryBuilder = queryBuilder
      .where(`${this.pkColumnName}= ?`, id.uid)
      .where('hackathon = ?', id.hackathon);
    const query = queryBuilder.toParam();
    query.text = query.text.concat(';');
    return from(this.sql.query<CheckoutObject>(query.text, query.values, { cache: true }))
      .pipe(
        map((checkoutObject: CheckoutObject[]) => ({ result: 'Success', data: checkoutObject[0] })),
      )
      .toPromise();
  }

  public async getAll(opts?: IUowOpts): Promise<IDbResult<CheckoutObject[]>> {
    let queryBuilder = squel.select({
      autoQuoteFieldNames: true,
      autoQuoteTableNames: true,
    })
      .from(this.tableName, 'checkoutObject');
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
    const query = queryBuilder.toParam()
    query.text = query.text.concat(';');
    return from(this.sql.query<CheckoutObject>(query.text, query.values, { cache: true }))
        .pipe(
          map((checkoutObjects: CheckoutObject[]) => ({ result: 'Success', data: checkoutObjects })),
        )
        .toPromise();
  }

  /**
   * Returns a count of the number of CheckoutObject objects.
   * @returns {Promise<Readable>}
   */
  public getCount(opts?: IUowOpts): Promise<IDbResult<number>> {
    const query = squel.select({
      autoQuoteFieldNames: false,
      autoQuoteTableNames: true,
    })
      .from(this.tableName)
      .field(`COUNT(${this.pkColumnName})`, 'count')
      .toParam()

      query.text = query.text.concat(';');
    return from(
      this.sql.query<number>(query.text, query.values, { cache: true }),
    ).pipe(
      map((result: number[]) => ({ result: 'Success', data: result[0] })),
    ).toPromise();
  }

  public insert(object: CheckoutObject): Promise<IDbResult<CheckoutObject>> {
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
      this.sql.query<void>(query.text, query.values, { cache: false }),
    ).pipe(
      map(() => ({ result: 'Success', data: object.cleanRepresentation })),
    ).toPromise();
  }

  public returnItem(returnTime: EpochNumber, uid: number) {
    const query = squel.update({
      autoQuoteFieldNames: true,
      autoQuoteTableNames: true,
    })
      .table(this.tableName)
      .set('return_time', returnTime)
      .where('uid = ?', uid)
      .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query<void>(query.text, query.values, { cache: false }),
    ).pipe(
      map(() => ({ result: 'Success', data: undefined })),
    ).toPromise();
  }

  public update(object: CheckoutObject): Promise<IDbResult<CheckoutObject>> {
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
      this.sql.query<void>(query.text, query.values, { cache: false }),
    ).pipe(
      map(() => ({ result: 'Success', data: object.cleanRepresentation })),
    ).toPromise();
  }
}
