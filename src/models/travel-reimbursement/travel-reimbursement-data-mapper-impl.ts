import { Inject, Injectable } from 'injection-js';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import * as squel from 'squel';
import { ICompoundHackathonUidType } from '../../JSCommon/common-types';
import { HttpError } from '../../JSCommon/errors';
import { AuthLevel } from '../../services/auth/auth-types';
import { IAcl, IAclPerm } from '../../services/auth/RBAC/rbac-types';
import { IDataMapperHackathonSpecific, IDbResult } from '../../services/database';
import { GenericDataMapper } from '../../services/database/svc/generic-data-mapper';
import { MysqlUow } from '../../services/database/svc/mysql-uow.service';
import { IUowOpts } from '../../services/database/svc/uow.service';
import { Logger } from '../../services/logging/logging';
import { IActiveHackathonDataMapper } from '../hackathon/active-hackathon';
import { TravelReimbursement } from './travel-reimbursement';

@Injectable()
export class TravelReimbursementDataMapperImpl extends GenericDataMapper
  implements IAclPerm, IDataMapperHackathonSpecific<TravelReimbursement> {
  public COUNT: string = 'travel_reimbursement:count';
  public CREATE: string = 'travel_reimbursement:create';
  public DELETE: string = 'travel_reimbursement:delete';
  public READ: string = 'travel_reimbursement:read';
  public READ_ALL: string = 'travel_reimbursement:readall';
  public UPDATE: string = 'travel_reimbursement:update';

  public tableName: string = 'TRAVEL_REIMBURSEMENT';
  protected pkColumnName: string = 'uid';

  constructor(
    @Inject('IAcl') acl: IAcl,
    @Inject('MysqlUow') protected readonly sql: MysqlUow,
    @Inject('IActiveHackathonDataMapper') private readonly activeHackathonDataMapper: IActiveHackathonDataMapper,
    @Inject('BunyanLogger') protected readonly logger: Logger,
  ) {
    super(acl);
    super.addRBAC(
      [this.DELETE],
      [AuthLevel.DIRECTOR],
      undefined,
      [AuthLevel[AuthLevel.TEAM_MEMBER]],
    );
    super.addRBAC(
      [this.READ_ALL],
      [AuthLevel.PARTICIPANT],
      undefined,
      [AuthLevel[AuthLevel.VOLUNTEER]],
    );
    super.addRBAC(
      [this.READ, this.UPDATE, this.CREATE],
      [AuthLevel.PARTICIPANT],
    );
  }

  public delete(id: ICompoundHackathonUidType): Promise<IDbResult<void>> {
    const query = squel.delete({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from(this.tableName)
      .where(`${this.pkColumnName} = ?`, id.uid)
      .where('hackathon = ?', id.hackathon)
      .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query(query.text, query.values, { cache: false }),
    ).pipe(
      map(() => ({ result: 'Success', data: undefined })),
    ).toPromise();
  }

  public get(
    id: ICompoundHackathonUidType,
    opts?: IUowOpts,
  ): Promise<IDbResult<TravelReimbursement>> {
    let queryBuilder = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(this.tableName);
    if (opts && opts.fields) {
      queryBuilder = queryBuilder.fields(opts.fields);
    }
    queryBuilder = queryBuilder
      .where(`${this.pkColumnName}= ?`, id.uid)
      .where('hackathon = ?', id.hackathon);
    const query = queryBuilder.toParam();
    query.text = query.text.concat(';');
    return from(this.sql.query<TravelReimbursement>(
      query.text,
      query.values,
      { cache: true },
    ))
      .pipe(
        map((travelReimbursement: TravelReimbursement[]) => ({
          data: travelReimbursement[0],
          result: 'Success',
        })),
      )
      .toPromise();
  }

  public async getAll(opts?: IUowOpts): Promise<IDbResult<TravelReimbursement[]>> {
    let queryBuilder = squel.select({
      autoQuoteFieldNames: true,
      autoQuoteTableNames: true,
    })
      .from(this.tableName, 'reimbursement')
      .join(
        this.activeHackathonDataMapper.tableName,
        'hackathon',
        'reimbursement.hackathon = hackathon.uid',
      );
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
          'hackathon.uid = ?',
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
    return from(this.sql.query<TravelReimbursement>(
      query.text,
      query.values,
      { cache: true },
    ))
      .pipe(
        map((reimbursements: TravelReimbursement[]) => ({
          data: reimbursements,
          result: 'Success',
        })),
      )
      .toPromise();
  }

  public getCount(opts?: IUowOpts): Promise<IDbResult<number>> {
    const query = this.getCountQuery().toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query<number>(query.text, query.values, { cache: true }),
    ).pipe(
      map((result: number[]) => ({ result: 'Success', data: result[0] })),
    ).toPromise();
  }

  public getCountQuery() {
    return squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: false })
      .from(this.tableName)
      .field(`COUNT(${this.pkColumnName})`, 'reimbursement_count');
  }

  public async insert(object: TravelReimbursement): Promise<IDbResult<TravelReimbursement>> {
    const validation = object.validate();
    if (!validation.result) {
      this.logger.warn('Validation failed while adding object.');
      this.logger.warn(object.dbRepresentation);
      return Promise.reject({ result: 'error', data: new HttpError(validation.error, 400) });
    }
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

  public update(object: TravelReimbursement): Promise<IDbResult<TravelReimbursement>> {
    const validation = object.validate();
    if (!validation.result) {
      this.logger.warn('Validation failed while updating object.');
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
      this.sql.query<void>(query.text, query.values, { cache: false }),
    ).pipe(
      map(() => ({ result: 'Success', data: object.cleanRepresentation })),
    ).toPromise();
  }
}
