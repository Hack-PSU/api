import { Inject, Injectable } from 'injection-js';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import squel from 'squel';
import { UidType } from '../../JSCommon/common-types';
import { MethodNotImplementedError } from '../../JSCommon/errors';
import { AuthLevel } from '../../services/auth/auth-types';
import { IAcl, IAclPerm } from '../../services/auth/RBAC/rbac-types';
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
  implements IAclPerm, IExtraCreditDataMapper {
  public COUNT: string;
  public CREATE: string = 'extra-credit:create';
  public DELETE: string;
  public READ: string;
  public READ_ALL: string = 'extra-credit:readall';
  public UPDATE: string;
  public tableName: string = 'EXTRA_CREDIT_ASSIGNMENT';
  public classesTableName: string = 'EXTRA_CREDIT_CLASSES';
  protected pkColumnName: string = 'uid';

  constructor(
    @Inject('IAcl') acl: IAcl,
    @Inject('MysqlUow') protected readonly sql: MysqlUow,
    @Inject('IActiveHackathonDataMapper') private readonly activeHackathonDataMapper: IActiveHackathonDataMapper,
    @Inject('BunyanLogger') protected readonly logger: Logger,
  ) {
    super(acl);
    super.addRBAC(
      [this.READ, this.READ_ALL, this.CREATE, this.UPDATE],
      [AuthLevel.TEAM_MEMBER],
      undefined,
      [AuthLevel[AuthLevel.VOLUNTEER]],
    );
    super.addRBAC(
      [this.DELETE],
      [AuthLevel.DIRECTOR],
      undefined,
      [AuthLevel[AuthLevel.VOLUNTEER]],
    );
  }

  public delete(object: UidType): Promise<IDbResult<void>> {
    throw new MethodNotImplementedError('this action is not supported');
  }

  public get(object: UidType, opts?: IUowOpts): Promise<IDbResult<ExtraCreditAssignment>> {
    throw new MethodNotImplementedError('this action is not supported');
  }

  public getAll(opts?: IUowOpts): Promise<IDbResult<ExtraCreditAssignment[]>> {
    let queryBuilder = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from(this.tableName);
    if (opts && opts.startAt) {
      queryBuilder = queryBuilder.offset(opts.startAt);
    }
    if (opts && opts.count) {
      queryBuilder = queryBuilder.limit(opts.count);
    }
    const query = queryBuilder
      .toParam();

    query.text = query.text.concat(';');
    return from(this.sql.query<ExtraCreditAssignment>(query.text, query.values, { cache: true }))
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
