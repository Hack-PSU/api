import { Inject, Injectable } from 'injection-js';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import * as squel from 'squel';
import { Stream } from 'ts-stream';
import { UidType } from '../../JSCommon/common-types';
import { HttpError, MethodNotImplementedError } from '../../JSCommon/errors';
import { AuthLevel } from '../../services/auth/auth-types';
import { IAcl, IAclPerm } from '../../services/auth/RBAC/rbac-types';
import { IDbResult } from '../../services/database';
import { GenericDataMapper } from '../../services/database/svc/generic-data-mapper';
import { MysqlUow } from '../../services/database/svc/mysql-uow.service';
import { IUowOpts } from '../../services/database/svc/uow.service';
import { Logger } from '../../services/logging/logging';
import { IActiveHackathonDataMapper } from '../hackathon/active-hackathon';
import { IProjectDataMapper } from './index';
import { Project } from './project';

@Injectable()
export class ProjectDataMapperImpl extends GenericDataMapper
  implements IAclPerm, IProjectDataMapper {

  public COUNT: string = 'project:count';
  public CREATE: string = 'project:create';
  public DELETE: string = 'project:delete';
  public READ: string = 'project:read';
  public READ_ALL: string;
  public UPDATE: string = 'project:update';

  public tableName: string = 'PROJECT_TEAM';
  protected pkColumnName: string = 'projectID';

  constructor(
    @Inject('IAcl') acl: IAcl,
    @Inject('MysqlUow') protected readonly sql: MysqlUow,
    @Inject('IActiveHackathonDataMapper') protected readonly activeHackathonDataMapper: IActiveHackathonDataMapper,
    @Inject('BunyanLogger') protected readonly logger: Logger,
  ) {
    super(acl);
    super.addRBAC(
      [this.DELETE],
      [AuthLevel.DIRECTOR, AuthLevel.TECHNOLOGY],
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

  public delete(projectID: UidType): Promise<IDbResult<void>> {
    const query = squel.delete({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from(this.tableName)
      .where(`${this.pkColumnName} = ?`, projectID)
      .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query(query.text, query.values, { stream: false, cache: false }),
    ).pipe(
      map(() => ({ result: 'Success', data: undefined })),
    ).toPromise();
  }

  public get(projectID: UidType, opts?: IUowOpts): Promise<IDbResult<Project>> {
    let queryBuilder = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(this.tableName);
    if (opts && opts.fields) {
      queryBuilder = queryBuilder.fields(opts.fields);
    }
    queryBuilder = queryBuilder
      .where(`${this.pkColumnName} = ?`, projectID);
    const query = queryBuilder.toParam();
    query.text = query.text.concat(';');
    return from(this.sql.query<Project>(
      query.text,
      query.values,
      { stream: false, cache: true },
    ))
      .pipe(
        map((event: Project[]) => ({ result: 'Success', data: event[0] })),
      )
      .toPromise();
  }

  public async getAll(opts?: IUowOpts): Promise<IDbResult<Stream<Project>>> {
    throw new MethodNotImplementedError('This method is not implemented');
  }

  // public getByUser(uid: UidType): Promise<IDbResult<Project>> {
  //   //const query = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true });
  // }

  public async getCount(opts?: IUowOpts): Promise<IDbResult<number>> {
    let queryBuilder = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: false })
      .from(this.tableName)
      .field(`COUNT(${this.pkColumnName})`, 'project_count');
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
    const query = queryBuilder
      .toString()
      .concat(';');
    return from(
      this.sql.query<number>(query, [], { stream: true, cache: true }),
    ).pipe(
      map((result: number[]) => ({ result: 'Success', data: result[0] })),
    ).toPromise();
  }

  // need to be checked for conversion
  public async insert(object: Project): Promise<IDbResult<Project>> {
    const validation = object.validate();
    if (!validation.result) {
      this.logger.warn('Validation failed while adding object.');
      this.logger.warn(object.dbRepresentation);
      return Promise.reject({ result: 'error', data: new HttpError(validation.error, 400) });
    }
    let query = 'CALL ';
    query = query.concat('assignTeam');
    query = query.concat('(?,?,?,@projectID_out); SELECT @projectID_out as projectID;');
    const list = [object.project_name, object.team.join(','), object.categories.join(',')];
    return from(
      this.sql.query<UidType>(query, list, { stream: false, cache: false }),
    ).pipe(
      map((result: UidType[]) => {
        object.projectId = result[0];
        return { result: 'Success', data: object };
      }),
    ).toPromise();
  }

  public update(object: Project): Promise<IDbResult<Project>> {
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

  // Currently not being called anywhere so a further work will be needed
  public assignTable(object: Project): Promise<IDbResult<number>> {
    let query = 'CALL ';
    query = query.concat('assignTable')
      .concat('(?,?,@tableNumber_out); SELECT @tableNumber_out as table_number;');
    const list = [object.projectId, Math.min(...object.categories.map(c => parseInt(c, 10)))];
    return from(
      this.sql.query<number>(query, list, { stream: true, cache: false }),
    ).pipe(
      map((result: number[]) => ({ result: 'Success', data: object[0] })),
    ).toPromise();

  }
}
