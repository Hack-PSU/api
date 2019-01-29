import { Inject, Injectable } from 'injection-js';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import * as squel from 'squel';
import { Stream } from 'ts-stream';
import { Attendance } from './Attendance';
import { MethodNotImplementedError } from '../../JSCommon/errors';
import { AuthLevel } from '../../services/auth/auth-types';
import { IAcl, IAclPerm } from '../../services/auth/RBAC/rbac-types';
import { IDataMapper, IDbResult } from '../../services/database';
import { GenericDataMapper } from '../../services/database/svc/generic-data-mapper';
import { MysqlUow } from '../../services/database/svc/mysql-uow.service';
import { IUowOpts } from '../../services/database/svc/uow.service';
import { Logger } from '../../services/logging/logging';
import { IActiveHackathonDataMapper } from '../hackathon/active-hackathon';

export const TABLE_NAME = 'ATTENDANCE';

/**
 * TODO: Add documentation
 */
@Injectable()
export class AttendanceDataMapperImpl extends GenericDataMapper
  implements IAclPerm, IDataMapper<Attendance> {

  public readonly CREATE: string = 'attendance:create';
  public readonly DELETE: string = 'attendance:delete';
  public readonly READ: string = 'attendance:read';
  public readonly UPDATE: string = 'attendance:update';
  public readonly READ_ALL: string = 'attendance:readall';
  public readonly COUNT: string = 'attendance:count';
  protected pkColumnName: string = 'uid';

  get tableName() {
    return TABLE_NAME;
  }

  constructor(
    @Inject('IAcl') acl: IAcl,
    @Inject('MysqlUow') protected readonly sql: MysqlUow,
    @Inject('IActiveHackathonDataMapper') protected readonly activeHackathonDataMapper: IActiveHackathonDataMapper,
    @Inject('BunyanLogger') protected readonly logger: Logger,
  ) {
    super(acl);
    super.addRBAC(
      [this.READ, this.READ_ALL],
      [
        AuthLevel.TECHNOLOGY,
      ],
      undefined,
      [AuthLevel[AuthLevel.DIRECTOR]],
    );
  }

  /**
   *
   * @param uow
   * @param opts
   * @return {Promise<Stream>}
   */
  public async getAll(opts?: IUowOpts): Promise<IDbResult<Stream<Attendance>>> {
    let queryBuilder = squel.select({
      autoQuoteFieldNames: true,
      autoQuoteTableNames: true,
    })
      .from(this.tableName, 'attendance');
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
    return from(this.sql.query<Attendance>(query, [], { stream: true, cache: true }))
        .pipe(
          map((attendanceStream: Stream<Attendance>) => ({
            data: attendanceStream,
            result: 'Success',
          })),
        )
        .toPromise();
  }

  /**
   * Returns a count of the number of Attendance objects.
   * @param uow
   * @returns {Promise<Readable>}
   */
  public async getCount(opts?: IUowOpts): Promise<IDbResult<number>> {
    let queryBuilder = squel.select({
      autoQuoteFieldNames: false,
      autoQuoteTableNames: true,
    })
      .from(this.tableName)
      .field(`COUNT(${this.pkColumnName})`, 'count');

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
    return from(
      this.sql.query<number>(query, [], { stream: true, cache: true }),
    ).pipe(
      map((result: number) => ({ result: 'Success', data: result })),
    ).toPromise();
  }

  public get(uid: string, opts?: IUowOpts): Promise<IDbResult<Attendance>> {
    throw new MethodNotImplementedError('This method is not supported by this class');
  }
  public insert(object: Attendance, opts?: IUowOpts): Promise<IDbResult<Attendance>> {
    throw new MethodNotImplementedError('This method is not supported by this class');
  }
  public update(object: Attendance, opts?: IUowOpts): Promise<IDbResult<Attendance>> {
    throw new MethodNotImplementedError('This method is not supported by this class');
  }
  public delete(uid: string, opts?: IUowOpts): Promise<IDbResult<void>> {
    throw new MethodNotImplementedError('This method is not supported by this class');
  }
}
