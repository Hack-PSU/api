import { Inject, ReflectiveInjector } from 'injection-js';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import { Stream } from 'stream';
import { HttpError } from '../../JSCommon/errors';
import { AuthLevel } from '../../services/auth/auth-types';
import { RBAC } from '../../services/auth/RBAC/rbac';
import { IAclPerm } from '../../services/auth/RBAC/rbac-types';
import { IDbResult } from '../../services/database';
import { GenericDataMapper } from '../../services/database/svc/generic-data-mapper';
import { MysqlUow } from '../../services/database/svc/mysql-uow.service';
import { IUowOpts } from '../../services/database/svc/uow.service';
import { logger } from '../../services/logging/logging';
import { Event } from './Event';
import { EventIdType, IEventDataMapper } from './index';

export class EventDataMapperImpl extends GenericDataMapper implements IEventDataMapper, IAclPerm {
  public readonly CREATE: string = 'event:create';
  public readonly DELETE: string = 'event:delete';
  public readonly READ: string = 'event:read';
  public readonly UPDATE: string = 'event:update';

  protected pkColumnName = 'uid';
  protected tableName = 'EVENTS';

  constructor(@Inject('MysqlUow') private sql: MysqlUow) {
    super(ReflectiveInjector.resolveAndCreate([RBAC]).get(RBAC));
    super.addRBAC(
      ['event:create', 'event:update', 'event:delete'],
      [AuthLevel.TEAM_MEMBER, AuthLevel.DIRECTOR, AuthLevel.TECHNOLOGY],
    );
    super.addRBAC(
      'event:read',
      [
        AuthLevel.PARTICIPANT,
        AuthLevel.VOLUNTEER,
        AuthLevel.TEAM_MEMBER,
        AuthLevel.DIRECTOR,
        AuthLevel.TECHNOLOGY,
      ],
    );
  }

  public delete(id: EventIdType): Promise<IDbResult<void>> {
    const query = squel.delete({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from(this.tableName)
      .where(`${this.pkColumnName} = ?`, id)
      .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query(query.text, query.values, { stream: false, cache: false }),
    ).pipe(
      map(() => ({ result: 'Success', data: null })),
    ).toPromise();
  }

  public get(id: EventIdType, opts?: IUowOpts): Promise<IDbResult<Event>> {
    const query = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(this.tableName)
      .fields((opts && opts.fields) || null)
      .where(`${this.pkColumnName}= ?`, id)
      .toParam();
    query.text = query.text.concat(';');
    return from(this.sql.query<Event>(query.text, query.values, { stream: false, cache: true }))
      .pipe(
        map((event: Event) => ({ result: 'Success', data: event })),
      )
      .toPromise();
  }

  public getAll(): Promise<IDbResult<Stream>> {
    const query = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from(this.tableName, 'event')
      .field('event.*')
      .field('location.location_name')
      .order('event_start_time', true)
      .join('LOCATIONS', 'location', 'event_location=location.uid')
      .join('HACKATHON', 'h', 'h.uid=event.hackathon and h.active=true')
      .toString()
      .concat(';');
    return from(this.sql.query<Stream>(query, [], { stream: true, cache: true }))
      .pipe(
        map((event: Stream) => ({ result: 'Success', data: event })),
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
      map((result: number) => ({ result: 'Success', data: result })),
    ).toPromise();
  }

  public insert(object: Event): Promise<IDbResult<Event>> {
    const validation = object.validate();
    if (!validation.result) {
      logger.warn('Validation failed while adding object.');
      logger.warn(object.dbRepresentation);
      return Promise.reject({ result: 'error', data: new HttpError(validation.error, 400) });
    }
    const query = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(this.tableName)
      .setFieldsRows([object.dbRepresentation])
      .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query<number>(query.text, query.params, { stream: true, cache: true }),
    ).pipe(
      map(() => ({ result: 'Success', data: object })),
    ).toPromise();
  }

  public update(object: Event): Promise<IDbResult<Event>> {
    const validation = object.validate();
    if (!validation.result) {
      logger.warn('Validation failed while adding object.');
      logger.warn(object.dbRepresentation);
      return Promise.reject({ result: 'error', data: new HttpError(validation.error, 400) });
    }
    const query = squel.update({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .table(this.tableName)
      .setFields(object.dbRepresentation)
      .where(`${this.pkColumnName} = ?`, object.id)
      .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query<number>(query.text, query.params, { stream: true, cache: true }),
    ).pipe(
      map(() => ({ result: 'Success', data: object })),
    ).toPromise();
  }
}
