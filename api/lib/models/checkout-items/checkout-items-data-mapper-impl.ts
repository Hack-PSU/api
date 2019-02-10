import { Inject, Injectable } from 'injection-js';
import { UidType } from 'JSCommon/common-types';
import { HttpError, MethodNotImplementedError } from 'JSCommon/errors';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthLevel } from 'services/auth/auth-types';
import { IAcl, IAclPerm } from 'services/auth/RBAC/rbac-types';
import { IDataMapper, IDbResult } from 'services/database';
import { GenericDataMapper } from 'services/database/svc/generic-data-mapper';
import { MysqlUow } from 'services/database/svc/mysql-uow.service';
import { IUowOpts } from 'services/database/svc/uow.service';
import { Logger } from 'services/logging/logging';
import * as squel from 'squel';
import { Stream } from 'ts-stream';
import tsStream from 'ts-stream';
import { CheckoutItems } from '.';
import { IActiveHackathonDataMapper } from '../hackathon/active-hackathon';

/**
 * TODO: Change 'CHECKOUT_DATA' to reference the checkoutObjectDataMapper and add documentation
 */

@Injectable()
export class CheckoutItemsDataMapperImpl extends GenericDataMapper
  implements IAclPerm, IDataMapper<CheckoutItems> {
  public readonly COUNT: string = 'checkoutItemss:count';
  public readonly CREATE: string = 'checkoutItems:create';
  public readonly DELETE: string = 'checkoutItems:delete';
  // Undefined actions for checkout items data mapper
  public readonly READ: string;
  public readonly READ_ALL: string;
  public readonly UPDATE: string;

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
      [this.CREATE, this.UPDATE, this.DELETE],
      [AuthLevel.TEAM_MEMBER],
      undefined,
      [AuthLevel[AuthLevel.VOLUNTEER]],
    );
    super.addRBAC(
      [this.READ, this.READ_ALL],
      [
        AuthLevel.TEAM_MEMBER,
      ],
    );
  }
  public delete(object: CheckoutItems): Promise<IDbResult<void>> {
    const query = squel.delete({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from(this.tableName)
      .where(`${this.pkColumnName} = ?`, CheckoutItems)
      .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query(query.text, query.values, { stream: false, cache: false }),
    ).pipe(
      map(() => ({ result: 'Success', data: undefined })),
    ).toPromise();
  }

  public getAllAvailable(): Promise<IDbResult<Stream<CheckoutItems>>> {
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

  public getAvailable() {
    const query = squel.select({
      autoQuoteFieldNames: true,
      autoQuoteTableNames: true,
    })
      .fields(['i.quantity - COUNT(c.uid) AS available', 'i.*'])
      .from('CHECKOUT_DATA', 'c')
      .join(this.tableName, 'i', 'c.item_id=i.uid')
      .join(this.activeHackathonDataMapper.tableName, 'h', 'c.hackathon=h.uid and h.active=1')
      .where(`c.uid=${this.pkColumnName}`)
      .toParam();

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
   * @param uow
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
      map(() => ({ result: 'Success', data: object })),
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
      map(() => ({ result: 'Success', data: object })),
    ).toPromise();
  }

  public get(object: UidType, opts?: IUowOpts): Promise<IDbResult<any>> {
    throw new MethodNotImplementedError('this action is not supported');
  }

  public getAll(opts?: IUowOpts): Promise<IDbResult<tsStream<any>>> {
    throw new MethodNotImplementedError('this action is not supported');
  }
}
