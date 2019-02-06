import { IUowOpts } from '../../services/database/svc/uow.service';
import { Inject, Injectable } from 'injection-js';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import * as squel from 'squel';
import { AuthLevel } from '../../services/auth/auth-types';
import { IAcl, IAclPerm } from '../../services/auth/RBAC/rbac-types';
import { MysqlUow } from '../../services/database/svc/mysql-uow.service';
import { Logger } from '../../services/logging/logging';
import { Stream } from 'ts-stream';
import { GenericDataMapper } from '../../services/database/svc/generic-data-mapper'
import { IDbResult } from "../../services/database";
import { CheckoutObject, ICheckoutObjectDataMapper } from '.';
import { UidType } from '../../JSCommon/common-types';
import { HttpError } from '../../JSCommon/errors';
import { IActiveHackathonDataMapper } from '../hackathon/active-hackathon';

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
  public delete(object: CheckoutObject): Promise<IDbResult<void>> {
    const query = squel.delete({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from(this.tableName)
      .where(`${this.pkColumnName} = ?`, object.id)
      .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query(query.text, query.values, { stream: false, cache: false }),
    ).pipe(
      map(() => ({ result: 'Success', data: undefined })),
    ).toPromise();
  }

  public get(id: UidType, opts?: IUowOpts): Promise<IDbResult<CheckoutObject>> {
    let queryBuilder = squel.select({ 
      autoQuoteFieldNames: true, 
      autoQuoteTableNames: true 
    })
      .from(this.tableName);
    if (opts && opts.fields) {
      queryBuilder = queryBuilder.fields(opts.fields);
    }
    queryBuilder = queryBuilder
      .where(`${this.pkColumnName}= ?`, id);
    const query = queryBuilder.toParam();
    query.text = query.text.concat(';');
    return from(this.sql.query<CheckoutObject>(query.text, query.values, { stream: false, cache: true }))
      .pipe(
        map((checkoutObject: CheckoutObject) => ({ result: 'Success', data: checkoutObject })),
      )
      .toPromise();
  }

  public async getAll(opts?: IUowOpts): Promise<IDbResult<Stream<CheckoutObject>>> {
    let queryBuilder = squel.select({
      autoQuoteFieldNames: true,
      autoQuoteTableNames: true,
    })
      .from(this.tableName, 'checkoutObject');
      if(opts && opts.fields) {
        queryBuilder = queryBuilder.fields(opts.fields);
      }
      if(opts && opts.startAt) {
        queryBuilder = queryBuilder.offset(opts.startAt);
      }
      if(opts && opts.count) {
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
      return from(this.sql.query<CheckoutObject>(query, [], { stream: true, cache: true}))
        .pipe(
          map((checkoutObjectStream: Stream<CheckoutObject>) => ({ result: 'Success', data: checkoutObjectStream }))
        )
        .toPromise();
  }

  /**
   * Returns a count of the number of CheckoutObject objects.
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
      map((result: number) => ({ result: 'Success', data: result })),
    ).toPromise();  
  } 
  
  public insert(object: CheckoutObject): Promise<IDbResult<CheckoutObject>> {
    const validation = object.validate();
    console.log(validation);
    console.log(object.dbRepresentation);
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
  
  public returnItem(object: CheckoutObject) {
    if (!object.return_time) {
      this.logger.warn('Return time not set');
      return Promise.reject(new HttpError('Return time not set', 400));
    }
    const query = squel.update({
      autoQuoteFieldNames: true,
      autoQuoteTableNames: true,
    })
      .table(this.tableName)
      .set('return_time', object.return_time)
      .where('uid = ?', object.uid)
      .toParam();
    return from(
      this.sql.query<void>(query.text, query.values, { stream: false, cache: false }),
    ).pipe(
      map(() => ({ result: 'Success', data: object.cleanRepresentation })),
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
      this.sql.query<void>(query.text, query.values, { stream: false, cache: false }),
    ).pipe(
      map(() => ({ result: 'Success', data: object.cleanRepresentation })),
    ).toPromise();
  }
}