import { IAcl, IAclPerm } from "services/auth/RBAC/rbac-types";
import { GenericDataMapper } from "../../services/database/svc/generic-data-mapper";
import { IDataMapper, IDbResult } from "../../services/database";
import { ProjectScoreCount, Score } from "./score";
import { IUowOpts } from "services/database/svc/uow.service";
import * as squel from "squel";
import { from } from "rxjs";
import { map } from "rxjs/operators";
import { Inject, Injectable } from 'injection-js';
import { default as _ } from 'lodash';
import { MysqlUow } from "../../services/database/svc/mysql-uow.service";
import { IActiveHackathonDataMapper } from "models/hackathon/active-hackathon";
import Logger from "bunyan";
import { IRegisterDataMapper } from "models/register";
import { AuthLevel } from "../../services/auth/auth-types";
import { IProjectDataMapper } from "../../models/project/project-data-mapper-impl";
import { Project } from "../../models/project/project";

export interface IScoreDataMapper extends IDataMapper<Score> {
  deleteScoring(project_id: number, judge: string): Promise<IDbResult<void>>;
  
  generateAssignments(emails: String[], projectsPerOrganizer: number): Promise<IDbResult<Score[]>>;

  getByUser(judge: string, opts?: IUowOpts | undefined): Promise<IDbResult<Score[]>>;
}

// TODO: create tests for these
@Injectable()
export class ScoreDataMapperImpl extends GenericDataMapper implements IScoreDataMapper, IAclPerm {
  
  public readonly READ: string = 'score:read';
  public readonly CREATE: string = 'score:create';
  public readonly DELETE: string = 'score:delete';
  public readonly READ_ALL: string = 'score:read';
  public readonly UPDATE: string = 'score:create';
  public readonly COUNT: string = 'score:count';

  public readonly TABLE_NAME: string = 'SCORES';
  public readonly PROJECTS_TABLE_NAME: string = 'PROJECTS';
  protected readonly pkColumnName: string = 'unused cause these interfaces suck lol';
  
  constructor(
    @Inject('IAcl') acl: IAcl,
    @Inject('MysqlUow') protected readonly sql: MysqlUow,
    @Inject('IActiveHackathonDataMapper') protected readonly activeHackathonDataMapper: IActiveHackathonDataMapper,
    @Inject('IRegisterDataMapper') protected readonly registerDataMapper: IRegisterDataMapper,
    @Inject('IProjectDataMapper') protected readonly projectDataMapper: IProjectDataMapper,
    @Inject('BunyanLogger') protected readonly logger: Logger,
  ) {
    super(acl);
    super.addRBAC(
      [this.CREATE],
      [AuthLevel.TEAM_MEMBER],
    );
    super.addRBAC(
      [this.READ],
      [AuthLevel.DIRECTOR],
    )
  }

  public async insert(object: Score): Promise<IDbResult<Score>> {
    const query = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(this.tableName)
      .setFieldsRows([object.dbRepresentation])
      .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query<void>(query.text, query.values, { cache: false }),
    ).pipe(
      map(() => ({ result: 'Success', data: object.cleanRepresentation })),
    ).toPromise();
  }

  public async update(object: Score): Promise<IDbResult<Score>> {
    let queryBuilder = squel.update({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .table(this.tableName)
      .where(`project_id = ?`, object.project_id)
      .where(`judge = ?`, object.judge)
      .setFields(object.dbRepresentation);
    const query = queryBuilder.toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query<void>(query.text, query.values, { cache: false }),
    ).pipe(
      map(() => ({ result: 'Success', data: object })),
    ).toPromise();
  }

  public async deleteScoring(uid: number, judge: string): Promise<IDbResult<void>> {
    const query = squel.delete({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from(this.tableName)
      .where(`project_id = ?`, uid)
      .where(`judge = ?`, judge)
      .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query(query.text, query.values, { cache: false }),
    ).pipe(
      map(() => ({ result: 'Success', data: undefined })),
    ).toPromise();
  }

  public async getByUser(judge: string, opts?: IUowOpts | undefined): Promise<IDbResult<Score[]>> {
    let queryBuilder = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(this.tableName)
      .where('judge = ?', judge)
      .join(`${this.PROJECTS_TABLE_NAME}`, "projects", `projects.uid = ${this.TABLE_NAME}.project_id`);
    if (opts && opts.startAt) {
      queryBuilder = queryBuilder.offset(opts.startAt);
    }
    if (opts && opts.count) {
      queryBuilder = queryBuilder.limit(opts.count);
    }
    if (opts && opts.hackathon) {
      queryBuilder = queryBuilder
        .where('hackathon = ?', opts.hackathon);
    } else {
      queryBuilder = queryBuilder
        .where('hackathon = ?', (await this.activeHackathonDataMapper.activeHackathon.toPromise()).uid);
    }
    const query = queryBuilder.toParam();
    query.text = query.text.concat(';');
    return from(this.sql.query<Score>(query.text, query.values, { cache: false }))
      .pipe(map((scores: Score[]) => ({ result: 'Success', data: scores })))
      .toPromise();
  }

  public async getAll(opts?: IUowOpts | undefined): Promise<IDbResult<Score[]>> {
    let queryBuilder = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(this.tableName)
      .where('submitted = ?', 1)
      .join(`${this.PROJECTS_TABLE_NAME}`, "projects", `projects.uid = ${this.TABLE_NAME}.project_id`);
    if (opts && opts.startAt) {
      queryBuilder = queryBuilder.offset(opts.startAt);
    }
    if (opts && opts.count) {
      queryBuilder = queryBuilder.limit(opts.count);
    }
    if (opts && opts.hackathon) {
      queryBuilder = queryBuilder
        .where('hackathon = ?', opts.hackathon);
    } else {
      queryBuilder = queryBuilder
        .where('hackathon = ?', (await this.activeHackathonDataMapper.activeHackathon.toPromise()).uid);
    }
    const query = queryBuilder.toParam();
    query.text = query.text.concat(';');
    return from(this.sql.query<Score>(query.text, query.values, { cache: false }))
      .pipe(map((scores: Score[]) => ({ result: 'Success', data: scores })))
      .toPromise();
  }

  public async generateAssignments(judges: string[], projectsPerJudge: number): Promise<IDbResult<Score[]>> {
    const activeHackathonUid = (await this.activeHackathonDataMapper.activeHackathon.toPromise()).uid;
    
    const projectsQuery = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .field('project_id')
      .field(`COUNT(project_id)`, 'project_count')
      .from(this.PROJECTS_TABLE_NAME, 'p')
      .outer_join(this.tableName, 's', `p.uid = s.project_id AND p.hackathon = ${activeHackathonUid}`)
      .group('project_id')
      .order('project_count')
      .toParam();
    const projects: ProjectScoreCount[] = (await this.sql.query<ProjectScoreCount>(
      projectsQuery.text, projectsQuery.values, {cache: false })) as ProjectScoreCount[];

    /* TODO: deal with the possibility of this assigning the same project to the same judge twice
       This would break if there were there same number of judges and projects, but there are other
       cases where the multiples could line up as well that we would want to avoid.
    */
    var assignmentsToAdd: Score[] = [];
    var index = 0;
    for (let i=0; i<projectsPerJudge; i++) {
      judges.forEach(judge => {
        assignmentsToAdd.push(Score.blankScore(projects[index % projects.length].project_id as number, judge));
        index++;
      })
    }

    const query = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(this.tableName)
      .setFieldsRows(assignmentsToAdd)
      .toParam();
    await this.sql.query<void>(query.text, query.values, { cache: false });
    return this.getAll();
  }

  get(object: string, opts?: IUowOpts | undefined): Promise<IDbResult<Score>> {
    throw new Error("Method not implemented.");
  }

  public async delete(object: Score): Promise<IDbResult<void>> {
    const query = squel.delete({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from(this.tableName)
      .where(`${this.pkColumnName} = ?`, object.project_id)
      .where(`${this.pkColumnName} = ?`, object.judge)
      .toParam();
    query.text = query.text.concat(';');
    return from(this.sql.query(query.text, query.values, { cache: false }))
      .pipe(map(() => ({ result: 'Success', data: undefined })))
      .toPromise();
  }

  public async getCount(opts?: IUowOpts | undefined): Promise<IDbResult<number>> {
    throw new Error("Method not implemented.");
  }

  get tableName() {
    return this.TABLE_NAME;
  } 
  
}