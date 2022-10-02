import squel from "squel";
import { map } from "rxjs/operators";
import { from } from "rxjs";
import { Inject, Injectable } from "injection-js";
import Logger from "bunyan";
import { UidType } from "JSCommon/common-types";
import { IUowOpts } from "../../services/database/svc/uow.service";
import { IDataMapper, IDbResult } from "../../services/database";
import { GenericDataMapper } from "../../services/database/svc/generic-data-mapper";
import { IAcl, IAclPerm } from "../../services/auth/RBAC/rbac-types";
import { MysqlUow } from "../../services/database/svc/mysql-uow.service";
import { AuthLevel } from "../../services/auth/auth-types";
import { Sponsor } from "./sponsor";
import { IActiveHackathonDataMapper } from "../../models/hackathon/active-hackathon";

export interface ISponsorDataMapper extends IDataMapper<Sponsor> {
  deleteSponsor(uid: number): Promise<IDbResult<void>>;
}

// TODO: create tests for these
@Injectable()
export class SponsorDataMapperImpl extends GenericDataMapper implements ISponsorDataMapper, IAclPerm {
  public tableName: string = 'SPONSORS';
  
  public readonly READ: string = 'sponsor:read';
  public readonly CREATE: string = 'sponsor:create';
  public readonly DELETE: string = 'sponsor:delete';
  public readonly READ_ALL: string = 'sponsor:read';
  public readonly UPDATE: string = 'sponsor:create';
  public readonly COUNT: string = 'sponsor:count';

  protected readonly pkColumnName: string = 'uid';
  
  constructor(
    @Inject('IAcl') acl: IAcl,
    @Inject('MysqlUow') protected readonly sql: MysqlUow,
    @Inject('IActiveHackathonDataMapper') protected readonly activeHackathonDataMapper: IActiveHackathonDataMapper,
    @Inject('BunyanLogger') protected readonly logger: Logger,
  ) {
    super(acl);
    super.addRBAC(
      [this.CREATE],
      [AuthLevel.TEAM_MEMBER],
      undefined,
      [AuthLevel[AuthLevel.VOLUNTEER]],
    );
    super.addRBAC(
      [this.READ],
      [AuthLevel.PARTICIPANT],
    )
  }  
  
  public async get(uid: UidType, opts?: IUowOpts | undefined): Promise<IDbResult<Sponsor>> {
    let queryBuilder = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(this.tableName)
      .where(`${this.pkColumnName} = ?`, uid);
    if (opts && opts.fields) {
      queryBuilder = queryBuilder.fields(opts.fields);
    }
    let useCache: boolean = true;
    if (opts && opts.ignoreCache) {
      useCache = false;
    }
    const query = queryBuilder.toParam();
    query.text = query.text.concat(';');
    return from(this.sql.query<Sponsor>(query.text, query.values, { cache: useCache }))
      .pipe(map((sponsors: Sponsor[]) => ({ result: 'Success', data: sponsors[0] })))
      .toPromise();
  }

  public async insert(object: Sponsor): Promise<IDbResult<Sponsor>> {
    const query = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(this.tableName)
      .setFieldsRows([object.dbRepresentation])
      .toParam();
    query.text = query.text.concat(';');
    return from(this.sql.query<void>(query.text, query.values, { cache: false }))
      .pipe(map(() => ({ result: 'Success', data: object.cleanRepresentation })))
      .toPromise();
  }

  public async update(object: Sponsor): Promise<IDbResult<Sponsor>> {
    let queryBuilder = squel.update({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .table(this.tableName)
      .where(`${this.pkColumnName} = ?`, object.uid)
      .setFields(object.dbRepresentation);
    const query = queryBuilder.toParam();
    query.text = query.text.concat(';');
    return from(this.sql.query<void>(query.text, query.values, { cache: false }))
      .pipe(map(() => ({ result: 'Success', data: object })))
      .toPromise();
  }

  public async deleteSponsor(uid: number): Promise<IDbResult<void>> {
    const query = squel.delete({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from(this.tableName)
      .where(`${this.pkColumnName} = ?`, uid)
      .toParam();
    query.text = query.text.concat(';');
    return from(this.sql.query(query.text, query.values, { cache: false }))
      .pipe(map(() => ({ result: 'Success', data: undefined })))
      .toPromise();
  }

  public async getAll(opts?: IUowOpts | undefined): Promise<IDbResult<Sponsor[]>> {
    let queryBuilder = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(this.tableName);
    if (opts && opts.hackathon) {
      queryBuilder = queryBuilder.where('hackathon = ?', opts.hackathon);
    } else {
      queryBuilder = queryBuilder
        .where('hackathon = ?', (await this.activeHackathonDataMapper.activeHackathon.toPromise()).uid);
    }
    if (opts && opts.startAt) {
      queryBuilder = queryBuilder.offset(opts.startAt);
    }
    if (opts && opts.count) {
      queryBuilder = queryBuilder.limit(opts.count);
    }
    var useCache: boolean = true;
    if (opts && opts.ignoreCache) {
      useCache = false;
    }
    const query = queryBuilder.toParam();
    query.text = query.text.concat(';');
    return from(this.sql.query<Sponsor>(query.text, query.values, { cache: useCache }))
      .pipe(map((projects: Sponsor[]) => ({ result: 'Success', data: projects })))
      .toPromise();
  }

  public async getCount(opts?: IUowOpts | undefined): Promise<IDbResult<number>> {
    throw new Error("Method not implemented.");
  }

  public async delete(object: string | Sponsor): Promise<IDbResult<void>> {
    throw new Error("Method not implemented because these interfaces suck lol.");
  }

}
