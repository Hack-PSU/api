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
import { IRegisterDataMapper } from './index';
import { Registration } from './registration';

@Injectable()
export class RegisterDataMapperImpl extends GenericDataMapper
  implements IRegisterDataMapper, IAclPerm {

  public CREATE: string = 'registration:create';
  public DELETE: string = 'registration:delete';
  public READ: string = 'registration:read';
  public READ_ALL: string = 'registration:readall';
  public UPDATE: string = 'registration:update';

  public tableName: string;
  protected pkColumnName: string;

  constructor(
    @Inject('IAcl') acl: IAcl,
    @Inject('MysqlUow') protected readonly sql: MysqlUow,
    @Inject('IActiveHackathonDataMapper') private readonly activeHackathonDataMapper: IActiveHackathonDataMapper,
    @Inject('BunyanLogger') protected readonly logger: Logger,
  ) {
    super(acl);
    super.addRBAC([this.DELETE], [AuthLevel.DIRECTOR, AuthLevel.TECHNOLOGY]);
    super.addRBAC(
      [this.READ_ALL],
      [AuthLevel.VOLUNTEER, AuthLevel.TEAM_MEMBER, AuthLevel.DIRECTOR, AuthLevel.TECHNOLOGY],
    );
    super.addRBAC(
      [this.READ, this.UPDATE, this.CREATE],
      [AuthLevel.PARTICIPANT, AuthLevel.VOLUNTEER, AuthLevel.TEAM_MEMBER, AuthLevel.DIRECTOR, AuthLevel.TECHNOLOGY],
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

  public get(id: UidType, opts?: IUowOpts): Promise<IDbResult<Registration[]>> {
    let queryBuilder = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(this.tableName);
    if (opts && opts.fields) {
      queryBuilder = queryBuilder.fields(opts.fields);
    }
    queryBuilder = queryBuilder
      .where(`${this.pkColumnName}= ?`, id)
      .order('time', false);
    const query = queryBuilder.toParam();
    query.text = query.text.concat(';');
    return from(this.sql.query<Registration[]>(
      query.text,
      query.values,
      { stream: false, cache: true },
    ))
      .pipe(
        map((event: Registration[]) => ({ result: 'Success', data: event })),
      )
      .toPromise();
  }

  public async getAll(opts?: IUowOpts): Promise<IDbResult<Stream<Registration>>> {
    let queryBuilder = squel.select({
      autoQuoteFieldNames: true,
      autoQuoteTableNames: true,
    })
      .from(this.tableName, 'registration')
      .join(
        this.activeHackathonDataMapper.tableName,
        'hackathon',
        'reg.hackathon = hackathon.uid',
      );
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
        .where(
          'hackathon.uid = ?',
          await opts.hackathon ?
            Promise.resolve(opts.hackathon) :
            this.activeHackathonDataMapper.activeHackathon.toPromise(),
        );
    }
    const query = queryBuilder
      .toString()
      .concat(';');
    return from(this.sql.query<Registration>(query, [], { stream: true, cache: true }))
      .pipe(
        map((event: Stream<Registration>) => ({ result: 'Success', data: event })),
      )
      .toPromise();
  }

  public async getCount(opts?: IUowOpts): Promise<IDbResult<number>> {
    let queryBuilder = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: false })
      .from(this.tableName)
      .field(`COUNT(${this.pkColumnName})`, 'count');
    if (opts && opts.byHackathon) {
      queryBuilder = queryBuilder
        .where(
          'hackathon = ?',
          await opts.hackathon ?
            Promise.resolve(opts.hackathon) :
            this.activeHackathonDataMapper.activeHackathon.toPromise(),
        );
    }
    const query = queryBuilder
      .toString()
      .concat(';');
    const params = [];
    return from(
      this.sql.query<number>(query, params, { stream: true, cache: true }),
    ).pipe(
      map((result: number) => ({ result: 'Success', data: result })),
    ).toPromise();
  }

  public async insert(object: Registration): Promise<IDbResult<Registration>> {
    const validation = object.validate();
    if (!validation.result) {
      this.logger.warn('Validation failed while adding object.');
      this.logger.warn(object.dbRepresentation);
      return Promise.reject({ result: 'error', data: new HttpError(validation.error, 400) });
    }
    const query = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(this.tableName)
      .setFieldsRows([object.dbRepresentation])
      .set('hackathon', await this.activeHackathonDataMapper.activeHackathon.toPromise())
      .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query<void>(query.text, query.values, { stream: false, cache: false }),
    ).pipe(
      map(() => ({ result: 'Success', data: object })),
    ).toPromise();
  }

  public async submit(object: Registration): Promise<IDbResult<boolean>> {
    const query = squel.update({
      autoQuoteFieldNames: true,
      autoQuoteTableNames: true,
    })
      .table(this.tableName)
      .set('submitted', true)
      .where('uid = ?', object.id)
      .where('hackathon = ?', await this.activeHackathonDataMapper.activeHackathon.toPromise())
      .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query<void>(query.text, query.values, { stream: false, cache: false }),
    ).pipe(
      map(() => ({ result: 'Success', data: true })),
    ).toPromise();
  }

  public update(object: Registration): Promise<IDbResult<Registration>> {
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

  public getCurrent(id: UidType, opts?: IUowOpts): Promise<IDbResult<Registration>> {
    let queryBuilder = squel.select({ autoQuoteFieldNames: false, autoQuoteTableNames: true })
      .from(this.tableName, 'registration');
    queryBuilder = opts && opts.fields ?
      queryBuilder.fields(opts.fields) :
      queryBuilder.field('registration.*');
    const query = queryBuilder
      .field('registration.pin - hackathon.base_pin', 'pin')
      .where(`registration.${this.pkColumnName}= ?`, id)
      .join(
        this.activeHackathonDataMapper.tableName,
        'hackathon',
        'registration.hackathon = hackathon.uid and hackathon.active = 1',
      )
      .toParam();
    query.text = query.text.concat(';');
    return from(this.sql.query<Registration>(
      query.text,
      query.values,
      { stream: false, cache: true },
    ))
      .pipe(
        map((event: Registration) => ({ result: 'Success', data: event })),
      )
      .toPromise();
  }
}
