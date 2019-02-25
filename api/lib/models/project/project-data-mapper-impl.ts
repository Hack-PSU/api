import { Inject, Injectable } from 'injection-js';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import * as squel from 'squel';
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
import { IProjectDataMapper } from './index';
import { Project } from './project';

@Injectable()
export class ProjectDataMapperImpl extends GenericDataMapper
  implements IAclPerm, IProjectDataMapper {

  public COUNT: string = 'project:count';
  public CREATE: string = 'project:create';
  public DELETE: string = 'project:delete';
  public READ: string = 'project:read';
  public READ_ALL: string = 'project:readall';
  public UPDATE: string = 'project:update';

  public tableName: string = 'PROJECT_LIST';
  public teamTableName: string = 'PROJECT_TEAM';
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
      [AuthLevel.TECHNOLOGY],
      undefined,
      [AuthLevel[AuthLevel.DIRECTOR]],
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

  // TODO: Change parameter to CompoundUidType
  public delete(projectID: UidType): Promise<IDbResult<void>> {
    const query = squel.delete({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from(this.tableName)
      .where(`${this.pkColumnName} = ?`, projectID)
      .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query(query.text, query.values, { cache: false }),
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
      { cache: true },
    ))
      .pipe(
        map((event: Project[]) => ({ result: 'Success', data: event[0] })),
      )
      .toPromise();
  }

  public async getAll(opts?: IUowOpts): Promise<IDbResult<Project[]>> {
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
    const query = queryBuilder.toParam();
    query.text = query.text.concat(';');
    return from(this.sql.query<Project>(query.text, query.values, { cache: true },
      ))
      .pipe(map((projects: Project[]) => ({ result: 'Success', data: projects })),
      )
      .toPromise();
  }

  public async getByUser(uid: UidType, opts?: IUowOpts): Promise<IDbResult<Project>> {
    let queryBuilder = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from(this.teamTableName, 'project_team')
      .field('project_list.projectName')
      .field('project_team.*')
      .field('table_assignment.tableNumber')
      .field('category_list.*')
      .join(this.tableName, 'project_list', 'project_list.projectID=project_list.projectID')
      .join('PROJECT_CATEGORIES', 'project_category', 'project_category.projectID = project_team.projectID')
      .join('CATEGORY_LIST', 'category_list', 'category_list.uid = project_category.categoryID ')
      .left_join('TABLE_ASSIGNMENTS', 'table_assignment', 'table_assignment.projectID = project_list.project.ID')
      .where('project_team.userID = ?', uid);
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
    const query = queryBuilder.toParam();
    query.text = query.text.concat(';');
    return from(this.sql.query<Project>(query.text, query.values, { cache: true },
      ))
      .pipe(map((project: Project[]) => ({ result: 'Success', data: project[0] })),
      )
      .toPromise();
  }

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
      .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query<number>(query.text, query.values, { cache: true }),
    ).pipe(
      map((result: number[]) => ({ result: 'Success', data: result[0] })),
    ).toPromise();
  }

  public async insert(object: Project): Promise<IDbResult<Project>> {
    const validation = object.validate();
    if (!validation.result) {
      this.logger.warn('Validation failed while adding object.');
      this.logger.warn(object.dbRepresentation);
      return Promise.reject({ result: 'error', data: new HttpError(validation.error, 400) });
    }
    const query = 'CALL assignTeam (?,?,?,@projectID_out); SELECT @projectID_out as projectID;';
    const list = [object.project_name, object.team.join(','), object.categories.join(',')];
    return from(
      this.sql.query<UidType>(query, list, { cache: false }),
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
    let queryBuilder = squel.update({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .table(this.tableName)
      .where(`${this.pkColumnName} = ?`, object.id);
    if (object.team) {
      queryBuilder = queryBuilder.set('team', object.team.join(','));
    }
    const query = queryBuilder.toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query<void>(query.text, query.values, { cache: false }),
    ).pipe(
      map(() => ({ result: 'Success', data: object })),
    ).toPromise();
  }

  public assignTable(object: Project): Promise<IDbResult<number>> {
    let query = 'CALL ';
    query = query.concat('assignTable')
      .concat('(?,?,@tableNumber_out); SELECT @tableNumber_out as table_number;');
    const list = [object.projectId, Math.min(...object.categories.map(c => parseInt(c, 10)))];
    return from(
      this.sql.query<number>(query, list, { cache: false }),
    ).pipe(
      map((result: number[]) => ({ result: 'Success', data: result[0] })),
    ).toPromise();

  }
}
