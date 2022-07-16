import { Inject, Injectable } from 'injection-js';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import { GenericDataMapper } from '../../services/database/svc/generic-data-mapper';
import * as squel from 'squel';
import { UidType } from '../../JSCommon/common-types';
import { AuthLevel } from '../../services/auth/auth-types';
import { IAcl, IAclPerm } from '../../services/auth/RBAC/rbac-types';
import { IDataMapper, IDbResult } from '../../services/database';
import { MysqlUow } from '../../services/database/svc/mysql-uow.service';
import { IUowOpts } from '../../services/database/svc/uow.service';
import { Logger } from '../../services/logging/logging';
import { IActiveHackathonDataMapper } from '../hackathon/active-hackathon';
import { Project } from './project';

export interface IProjectDataMapper extends IDataMapper<Project> {

  // the normal delete requires a String uid, but we use a numerical uid for these in the database. Until we refactor, this is how it's going to have to be, unfortunately.
  deleteProject(uid: Number): Promise<IDbResult<void>>;

}
@Injectable()
export class ProjectDataMapperImpl extends GenericDataMapper implements IAclPerm, IProjectDataMapper {

  public COUNT: string = 'project:count';
  public CREATE: string = 'project:create';
  public DELETE: string = 'project:delete';
  public READ: string = 'project:read';
  public READ_ALL: string = 'project:readall';
  public UPDATE: string = 'project:update';

  public tableName: string = 'PROJECTS';
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

  public async delete(uid: UidType): Promise<IDbResult<void>> {
    const query = squel.delete({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from(this.tableName)
      .where(`${this.pkColumnName} = ?`, uid)
      .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query(query.text, query.values, { cache: false }),
    ).pipe(
      map(() => ({ result: 'Success', data: undefined })),
    ).toPromise();
  }

  public async deleteProject(uid: Number): Promise<IDbResult<void>> {
    const query = squel.delete({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
    .from(this.tableName)
    .where(`${this.pkColumnName} = ?`, uid)
    .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query(query.text, query.values, { cache: false }),
    ).pipe(
      map(() => ({ result: 'Success', data: undefined })),
    ).toPromise();
  }

  public async get(uid: UidType, opts?: IUowOpts): Promise<IDbResult<Project>> {
    let queryBuilder = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(this.tableName);
    if (opts && opts.fields) {
      queryBuilder = queryBuilder.fields(opts.fields);
    }
    queryBuilder = queryBuilder
      .where(`${this.pkColumnName} = ?`, uid);
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
    let queryBuilder = squel.insert({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .into(this.tableName)
      .setFieldsRows([object.dbRepresentation]);
    if (!object.hackathon) {
      queryBuilder = queryBuilder.set(
        'hackathon', 
        await this.activeHackathonDataMapper.activeHackathon.pipe(map(hackathon => hackathon.uid)).toPromise());
    }
    const query = queryBuilder.toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query<void>(query.text, query.values, { cache: false })
    ).pipe(
      map(() => ({ result: 'Success', data: object.cleanRepresentation }))
    ).toPromise();
  }

  public update(object: Project): Promise<IDbResult<Project>> {
    let queryBuilder = squel.update({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .table(this.tableName)
      .where(`${this.pkColumnName} = ?`, object.id)
      .setFields(object.dbRepresentation);
    const query = queryBuilder.toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query<void>(query.text, query.values, { cache: false }),
    ).pipe(
      map(() => ({ result: 'Success', data: object })),
    ).toPromise();
  }
}
