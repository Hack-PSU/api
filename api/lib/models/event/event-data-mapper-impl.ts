import { Inject, Injectable } from 'injection-js';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import * as squel from 'squel';
import { Stream } from 'ts-stream';
import { UidType } from '../../JSCommon/common-types';
import { HttpError } from '../../JSCommon/errors';
import { AuthLevel } from '../../services/auth/auth-types';
import { IAcl, IAclPerm } from '../../services/auth/RBAC/rbac-types';
import { IDataMapper, IDbResult } from '../../services/database';
import { GenericDataMapper } from '../../services/database/svc/generic-data-mapper';
import { MysqlUow } from '../../services/database/svc/mysql-uow.service';
import { IUowOpts } from '../../services/database/svc/uow.service';
import { Logger } from '../../services/logging/logging';
import { Event } from './event';

@Injectable()
export class EventDataMapperImpl extends GenericDataMapper implements IDataMapper<Event>, IAclPerm {
  // ACL permissions
  public readonly CREATE: string = 'event:create';
  public readonly DELETE: string = 'event:delete';
  public readonly READ: string = 'event:read';
  public readonly UPDATE: string = 'event:update';
  public readonly READ_ALL: string = 'event:readall';
  public readonly COUNT: string = 'event:count';
  public tableName = 'EVENTS';

  protected pkColumnName = 'uid';

  constructor(
    @Inject('IAcl') acl: IAcl,
    @Inject('MysqlUow') protected readonly sql: MysqlUow,
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
        AuthLevel.PARTICIPANT,
      ],
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

  public get(id: UidType, opts?: IUowOpts): Promise<IDbResult<Event>> {
    let queryBuilder = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(this.tableName);
    if (opts && opts.fields) {
      queryBuilder = queryBuilder.fields(opts.fields);
    }
    queryBuilder = queryBuilder
      .where(`${this.pkColumnName}= ?`, id);
    const query = queryBuilder.toParam();
    query.text = query.text.concat(';');
    return from(this.sql.query<Event>(query.text, query.values, { stream: false, cache: true }))
      .pipe(
        map((event: Event[]) => ({ result: 'Success', data: event[0] })),
      )
      .toPromise();
  }

  public getAll(): Promise<IDbResult<Stream<Event>>> {
    const query = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from(this.tableName, 'event')
      .field('event.*')
      .field('location.location_name')
      .order('event_start_time', true)
      .join('LOCATIONS', 'location', 'event_location=location.uid')
      .join('HACKATHON', 'h', 'h.uid=event.hackathon and h.active=true')
      .toString()
      .concat(';');
    return from(this.sql.query<Event>(query, [], { stream: true, cache: true }))
      .pipe(
        map((event: Stream<Event>) => ({ result: 'Success', data: event })),
      )
      .toPromise();
  }

  public getCount(): Promise<IDbResult<number>> {
    const query = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: false })
      .from(this.tableName)
      .field(`COUNT(${this.pkColumnName})`, 'count')
      .toString()
      .concat(';');
    const params = [];
    return from(
      this.sql.query<number>(query, params, { stream: true, cache: true }),
    ).pipe(
      map((result: number[]) => ({ result: 'Success', data: result[0] })),
    ).toPromise();
  }

  public insert(object: Event): Promise<IDbResult<Event>> {
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

  public update(object: Event): Promise<IDbResult<Event>> {
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
}
