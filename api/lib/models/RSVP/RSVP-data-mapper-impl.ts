import { Inject, Injectable } from 'injection-js';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import squel from 'squel';
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
import { IRSVPDataMapper } from './index';
import { RSVP } from './RSVP';

@Injectable()
export class RSVPDataMapperImpl extends GenericDataMapper
    implements IAclPerm, IRSVPDataMapper {

  public COUNT: string = 'rsvp:count';
  public CREATE: string = 'rsvp:create';
  public DELETE: string = 'rsvp:delete';
  public READ: string = 'rsvp:read';
  public READ_ALL: string = 'rsvp:delete';
  public UPDATE: string = 'rsvp:update';
  public tableName: string = 'RSVP';

  protected pkColumnName: string = 'uid';

  constructor(
    @Inject('IAcl') acl: IAcl,
    @Inject('MysqlUow') protected readonly sql: MysqlUow,
    @Inject('IActiveHackathonDataMapper') protected readonly activeHackathonDataMapper: IActiveHackathonDataMapper,
    @Inject('BunyanLogger') protected readonly logger: Logger,
  ) {
    super(acl);
    super.addRBAC(
      [this.DELETE],
      [AuthLevel.DIRECTOR],
      undefined,
      [AuthLevel[AuthLevel.TEAM_MEMBER]],
    );
    super.addRBAC(
      [this.COUNT],
      [AuthLevel.TEAM_MEMBER],
      undefined,
      [AuthLevel[AuthLevel.VOLUNTEER]],
    );
    super.addRBAC(
      [this.READ_ALL],
      [AuthLevel.VOLUNTEER],
      undefined,
      [AuthLevel[AuthLevel.PARTICIPANT]],
    );
    super.addRBAC(
      [this.CREATE, this.READ, this.UPDATE],
      [AuthLevel.PARTICIPANT],
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

  public get(id: UidType, opts?: IUowOpts): Promise<IDbResult<RSVP>> {
    let queryBuilder = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(this.tableName);
    if (opts && opts.fields) {
      queryBuilder = queryBuilder.fields(opts.fields);
    }
    queryBuilder = queryBuilder
      .where(`${this.pkColumnName} = ?`, id);
    const query = queryBuilder.toParam();
    query.text = query.text.concat(';');
    return from(this.sql.query<RSVP>(
      query.text,
      query.values,
      { stream: false, cache: true },
    ))
      .pipe(
        map((event: RSVP[]) => ({ result: 'Success', data: event[0] })),
      )
      .toPromise();
  }

  public async getAll(opts?: IUowOpts): Promise<IDbResult<Stream<RSVP>>> {
    let queryBuilder = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(this.tableName);
    if (opts && opts.startAt) {
      queryBuilder = queryBuilder.offset(opts.startAt);
    }
    if (opts && opts.count) {
      queryBuilder = queryBuilder.limit(opts.count);
    }
    if (opts && opts.byHackathon) {
      queryBuilder = queryBuilder
        .where(
          'hackathon = ?',
          await (opts && opts.hackathon ?
            Promise.resolve(opts.hackathon) :
            this.activeHackathonDataMapper.activeHackathon
              .pipe(map(hackathon => hackathon.uid))
              .toPromise()),
        );
    }
    const query = queryBuilder
      .toParam();
    query.text = query.text.concat(';');
    return from(this.sql.query<RSVP>(query.text, query.values, { stream: true, cache: true },
    ))
      .pipe(
        map((event: Stream<RSVP>) => ({ result: 'Success', data: event })),
      )
      .toPromise();
  }

  public async getCount(opts?: IUowOpts): Promise<IDbResult<number>> {
    const query = (await this.getCountQuery(opts)).toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query<number>(query.text, query.values, { stream: true, cache: true }),
        ).pipe(
          map((result: number) => ({ result: 'Success', data: result })),
        ).toPromise();
  }

  public async getCountQuery(opts?: IUowOpts) {
    let queryBuilder = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: false })
      .from(this.tableName)
      .field(`COUNT(${this.pkColumnName})`, 'rsvp_count');
    if (opts && opts.byHackathon) {
      queryBuilder = queryBuilder
        .where(
          'hackathon = ?',
          await (opts.hackathon ?
            Promise.resolve(opts.hackathon) :
            this.activeHackathonDataMapper.activeHackathon
              .pipe(map(hackathon => hackathon.uid))
              .toPromise()),
        );
    }
    return queryBuilder;
  }

  public async insert(object: RSVP): Promise<IDbResult<RSVP>> {
    const validation = object.validate();
    if (!validation.result) {
      this.logger.warn('Validation failed while adding object.');
      this.logger.warn(object.dbRepresentation);
      return Promise.reject({ result: 'error', data: new HttpError(validation.error, 400) });
    }
    const query = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(this.tableName)
      .setFieldsRows([object.dbRepresentation])
      .set(
        'hackathon',
        await this.activeHackathonDataMapper.activeHackathon.pipe(map(hackathon => hackathon.uid)
        ).toPromise(),
    )
    .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query<void>(query.text, query.values, { stream: false, cache: false }),
    ).pipe(
      map(() => ({ result: 'Success', data: object })),
    ).toPromise();
  }

  public update(object: RSVP): Promise<IDbResult<RSVP>> {
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

  // IN-PROGRESS
  // public async rsvpStatus(id: UidType): Promise<IDbResult<boolean>> {
  //   const query = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
  //     .from(this.tableName)
  //     .field('rsvp.rsvp_status')
  //     .where('rsvp.user_id = ?', id)
  //     .where('hackathon = ?',
  //            await this.activeHackathonDataMapper.activeHackathon
  //         .pipe(map(hackathon => hackathon.uid))
  //         .toPromise())
  //     .toParam();
  //   query.text = query.text.concat(';');
  //   return from(this.sql.query<boolean>(
  //       query.text,
  //       query.values,
  //       { stream: true, cache: true },
  //     ))
  //     .pipe(
  //       map((status: boolean) => ({ result: 'Success', data: status })),
  //   ).toPromise();
  // }
}
