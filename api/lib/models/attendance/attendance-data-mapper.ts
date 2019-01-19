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
import { IActiveHackathonDataMapper } from '../hackathon/active-hackathon';
import { Attendance } from '../attendance';

export const TABLE_NAME = 'ATTENDANCE';

/**
 * TODO: Add documentation
 */

@Injectable()
export class AttendanceDataMapper extends GenericDataMapper
  implements IAclPerm {

 
  public readonly CREATE: string = 'attendance:create';
  public readonly DELETE: string = 'attendance:delete';
  public readonly READ: string = 'attendance:read';
  public readonly UPDATE: string = 'attendance:update';
  public readonly READ_ALL: string = 'attendance:readall';
  protected pkColumnName: string = 'uid';


  get tableName() {
    return TABLE_NAME;
  }

  constructor(
    @Inject('IAcl') acl: IAcl,
    @Inject('MysqlUow') protected readonly sql: MysqlUow,
    @Inject('IActiveHackathonDataMapper') protected readonly activeHackthonDataMapper: IActiveHackathonDataMapper,
    @Inject('BunyanLogger') protected readonly logger: Logger,
  ) {
    super(acl);
    super.addRBAC(
      [this.READ, this.READ_ALL],
      [
        AuthLevel.TEAM_MEMBER,
        AuthLevel.DIRECTOR,
        AuthLevel.TECHNOLOGY,
      ],
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
      if(opts && opts.fields) {
        queryBuilder = queryBuilder.fields(opts.fields);
      }
      if(opts && opts.startAt) {
        queryBuilder = queryBuilder.offset(opts.startAt);
      }
      if(opts && opts.count) {
        queryBuilder = queryBuilder.limit(opts.count);
      }
      if(opts && opts.byHackathon) {
        queryBuilder = queryBuilder.
          where(
            'hackathon_id = ?',
            await (opts.hackathon ?
              Promise.resolve(opts.hackathon) :
              this.activeHackthonDataMapper.activeHackathon.toPromise()),
          );
      }

      const query = queryBuilder
        .toString()
        .concat(';');
      return from(this.sql.query<Attendance>(query, [], { stream: true, cache: true}))
        .pipe(
          map((attendanceStream: Stream<Attendance>) => ({ result: 'Success', data: attendanceStream }))
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

    if(opts && opts.byHackathon) {
      queryBuilder = queryBuilder.
        where(
          'hackathon_id = ?',
          await (opts.hackathon ?
            Promise.resolve(opts.hackathon) :
            this.activeHackthonDataMapper.activeHackathon.toPromise()),
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

  
  public get(opts?: IUowOpts): Promise<any> | Promise<never> | Promise<any> {
    throw new Error('This method is not supported by this class');
  }
  public insert(opts?: IUowOpts): Promise<any> | Promise<never> | Promise<any> {
    throw new Error('This method is not supported by this class');
  }
  public update(opts?: IUowOpts): Promise<any> | Promise<never> | Promise<any> {
    throw new Error('This method is not supported by this class');
  }
  public delete(opts?: IUowOpts): Promise<any> | Promise<never> | Promise<any> {
    throw new Error('This method is not supported by this class');
  }
}