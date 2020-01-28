import { Inject, Injectable } from 'injection-js';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import squel from 'squel';
import { UidType } from '../../JSCommon/common-types';
import { MethodNotImplementedError } from '../../JSCommon/errors';
import { AuthLevel } from '../../services/auth/auth-types';
import { IAcl, IExtraCreditAclPerm } from '../../services/auth/RBAC/rbac-types';
import { IDbResult } from '../../services/database';
import { GenericDataMapper } from '../../services/database/svc/generic-data-mapper';
import { MysqlUow } from '../../services/database/svc/mysql-uow.service';
import { IUowOpts } from '../../services/database/svc/uow.service';
import { Logger } from '../../services/logging/logging';
import { IActiveHackathonDataMapper } from '../hackathon/active-hackathon';
import { ExtraCreditAssignment } from './extra-credit-assignment';
import { ExtraCreditClass } from './extra-credit-class';
import { IExtraCreditDataMapper } from './index';

@Injectable()
export class ExtraCreditDataMapperImpl extends GenericDataMapper
  implements IExtraCreditAclPerm, IExtraCreditDataMapper {
  public COUNT: string = 'extra-credit:count';
  public CREATE: string = 'extra-credit:create';
  public DELETE: string = 'extra-credit:delete';
  public READ: string = 'extra-credit:read';
  public READ_ALL: string = 'extra-credit:readall';
  public UPDATE: string;
  public tableName: string = 'EXTRA_CREDIT_ASSIGNMENT';
  public classesTableName: string = 'EXTRA_CREDIT_CLASSES';

  public READ_ALL_CLASSES: string = 'extra-credit:readall-classes';
  public READ_BY_CLASS: string = 'extra-credit:read-by-class';
  public READ_BY_UID: string = 'extra-credit:read-by-uid';
  protected pkColumnName: string = 'uid';

  constructor(
    @Inject('IAcl') acl: IAcl,
    @Inject('MysqlUow') protected readonly sql: MysqlUow,
    @Inject('IActiveHackathonDataMapper') private readonly activeHackathonDataMapper: IActiveHackathonDataMapper,
    @Inject('BunyanLogger') protected readonly logger: Logger,
  ) {
    super(acl);
    super.addRBAC(
      [this.READ_ALL_CLASSES, this.READ_BY_UID, this.CREATE, this.READ],
      [AuthLevel.PARTICIPANT],
    );
    super.addRBAC(
      [this.READ_ALL, this.READ_BY_CLASS, this.UPDATE],
      [AuthLevel.TEAM_MEMBER],
      undefined,
      [AuthLevel[AuthLevel.VOLUNTEER]],
    );
    super.addRBAC(
      [this.DELETE],
      [AuthLevel.DIRECTOR],
      undefined,
      [AuthLevel[AuthLevel.TEAM_MEMBER]],
    );
  }

  public delete(object: ExtraCreditAssignment): Promise<IDbResult<void>> {
    const query = squel.delete({
      autoQuoteTableNames: true,
      autoQuoteFieldNames: true,
    })
     .from(this.tableName)
     .where(`${this.pkColumnName} = ?`, object.uid)
     .toParam();
    query.text = query.text.concat(';');
    return from(
     this.sql.query(query.text, query.values, { cache: false }),
   ).pipe(
     map(() => ({ result: 'Success', data: undefined })),
   ).toPromise();
  }

  public get(uid: UidType , opts?: IUowOpts): Promise<IDbResult<ExtraCreditAssignment>> {
    let queryBuilder = squel.select({
      autoQuoteFieldNames: true,
      autoQuoteTableNames: true,
    })
      .from(this.tableName);
    if (opts && opts.fields) {
      queryBuilder = queryBuilder.fields(opts.fields);
    }
    queryBuilder = queryBuilder
      .where(`${this.pkColumnName}= ?`, parseInt(uid, 10));
    const query = queryBuilder
      .toParam();
    query.text = query.text
      .concat(';');
    return from(this.sql.query<ExtraCreditAssignment>(query.text, query.values, { cache: true }))
      .pipe(
        map((extraCreditAssignment: ExtraCreditAssignment[]) => ({ result: 'Success', data: extraCreditAssignment[0] })),
      )
      .toPromise();
  }

  public async getAll(opts?: IUowOpts): Promise<IDbResult<ExtraCreditAssignment[]>> {
    let queryBuilder = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from(this.tableName);
    let checkCache = true;
    if (opts && opts.ignoreCache) {
      checkCache = false;
    }
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
    return from(this.sql.query<ExtraCreditAssignment>(query.text, query.values, { cache: checkCache }))
      .pipe(
        map((classes: ExtraCreditAssignment[]) => ({ result: 'Success', data: classes })),
      )
      .toPromise();
  }

  public getCount(opts?: IUowOpts): Promise<IDbResult<number>> {
    throw new MethodNotImplementedError('this action is not supported');
  }

  public async getAllClasses(opts?: IUowOpts): Promise<IDbResult<ExtraCreditClass[]>> {
    let queryBuilder = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from(this.classesTableName);
    if (opts && opts.startAt) {
      queryBuilder = queryBuilder.offset(opts.startAt);
    }
    if (opts && opts.count) {
      queryBuilder = queryBuilder.limit(opts.count);
    }
    const query = queryBuilder
      .toParam();

    query.text = query.text.concat(';');
    return from(this.sql.query<ExtraCreditClass>(query.text, query.values, { cache: true }))
      .pipe(
        map((classes: ExtraCreditClass[]) => ({ result: 'Success', data: classes })),
      )
      .toPromise();
  }

  public async getByUser(
    userId: UidType,
    opts?: IUowOpts,
  ): Promise<IDbResult<ExtraCreditAssignment[]>> {
    let queryBuilder = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from(this.tableName);
    if (opts && opts.startAt) {
      queryBuilder = queryBuilder.offset(opts.startAt);
    }
    if (opts && opts.count) {
      queryBuilder = queryBuilder.limit(opts.count);
    }
    if (opts && opts.byHackathon) {
      queryBuilder = queryBuilder
        .join(
          'HACKATHON',
          'h',
          'h.uid = event.hackathon',
        )
        .where(
          'h.uid = ?',
          await (opts.hackathon ?
            Promise.resolve(opts.hackathon) :
            this.activeHackathonDataMapper.activeHackathon
              .pipe(map(hackathon => hackathon.uid))
              .toPromise()),
        );
    }

    queryBuilder = queryBuilder
      .where('user_uid = ?', userId);

    const query = queryBuilder
      .toParam();

    query.text = query.text.concat(';');
    return from(this.sql.query<ExtraCreditAssignment>(query.text, query.values, { cache: true }))
      .pipe(
        map((assignments: ExtraCreditAssignment[]) => ({ result: 'Success', data: assignments })),
      )
      .toPromise();
  }

  public async getByClass(cid: number, opts?: IUowOpts): Promise<IDbResult<ExtraCreditAssignment[]>> {
    let queryBuilder = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from(this.tableName);
    if (opts && opts.startAt) {
      queryBuilder = queryBuilder.offset(opts.startAt);
    }
    if (opts && opts.count) {
      queryBuilder = queryBuilder.limit(opts.count);
    }
    if (opts && opts.byHackathon) {
      queryBuilder = queryBuilder
        .join(
          'HACKATHON',
          'h',
          'h.uid = event.hackathon',
        )
        .where(
          'h.uid = ?',
          await (opts.hackathon ?
            Promise.resolve(opts.hackathon) :
            this.activeHackathonDataMapper.activeHackathon
              .pipe(map(hackathon => hackathon.uid))
              .toPromise()),
        );
    }

    queryBuilder = queryBuilder
      .where('class_uid = ?', cid);
    const query = queryBuilder
      .toParam();

    query.text = query.text.concat(';');
    return from(this.sql.query<ExtraCreditAssignment>(query.text, query.values, { cache: true }))
      .pipe(
        map((assignments: ExtraCreditAssignment[]) => ({ result: 'Success', data: assignments })),
      )
      .toPromise();
  }

  public async insert(object: ExtraCreditAssignment): Promise<IDbResult<ExtraCreditAssignment>> {
    const query = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(this.tableName)
      .setFieldsRows([object.dbRepresentation])
      .set(
        'hackathon',
        await this.activeHackathonDataMapper.activeHackathon.pipe(map(hackathon => hackathon.uid))
          .toPromise(),
      )
      .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query<void>(query.text, query.values, { cache: false }),
    ).pipe(
      map(() => ({ result: 'Success', data: object.cleanRepresentation })),
    ).toPromise();
  }

  public update(object: ExtraCreditAssignment): Promise<IDbResult<ExtraCreditAssignment>> {
    throw new MethodNotImplementedError('this action is not supported');
  }
}
