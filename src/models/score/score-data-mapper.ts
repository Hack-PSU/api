import { IAcl, IAclPerm } from "services/auth/RBAC/rbac-types";
import { GenericDataMapper } from "../../services/database/svc/generic-data-mapper";
import { IDataMapper, IDbResult } from "../../services/database";
import { Score } from "./score";
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

export interface IScoreDataMapper extends IDataMapper<Score> {
  
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
  protected readonly pkColumnName: string = 'unused cause these interfaces suck lol';
  
  constructor(
    @Inject('IAcl') acl: IAcl,
    @Inject('MysqlUow') protected readonly sql: MysqlUow,
    @Inject('IActiveHackathonDataMapper') protected readonly activeHackathonDataMapper: IActiveHackathonDataMapper,
    @Inject('IRegisterDataMapper') protected readonly registerDataMapper: IRegisterDataMapper,
    @Inject('BunyanLogger') protected readonly logger: Logger,
  ) {
    super(acl);
    // TODO: permissions
  }

  get(object: string, opts?: IUowOpts | undefined): Promise<IDbResult<Score>> {
    throw new Error("Method not implemented.");
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

  public async getAll(opts?: IUowOpts | undefined): Promise<IDbResult<Score[]>> {
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
    return from(this.sql.query<Score>(query.text, query.values, { cache: true },
      ))
      .pipe(map((scores: Score[]) => ({ result: 'Success', data: scores })),
      )
      .toPromise();
  }

  public async delete(object: string | Score): Promise<IDbResult<void>> {
    throw new Error("Method not implemented.");
  }

  public async getCount(opts?: IUowOpts | undefined): Promise<IDbResult<number>> {
    throw new Error("Method not implemented.");
  }

  get tableName() {
    return this.TABLE_NAME;
  } 
  
}