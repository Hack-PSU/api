import { Inject } from 'injection-js';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import squel from 'squel';
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
import { IPreRegisterDataMapper } from './index';
import { PreRegistration } from './pre-registration';

export class PreRegisterDataMapperImpl extends GenericDataMapper
  implements IPreRegisterDataMapper, IAclPerm {

  public CREATE: string = 'pre-registration:create';
  public DELETE: string = 'pre-registration:delete';
  public READ: string = 'pre-registration:read';
  public UPDATE: string = 'pre-registration:update';
  public READ_ALL: string = 'pre-registration:readall';
  public COUNT: string = 'pre-registration:count';
  public tableName: string = 'PRE_REGISTRATION';

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
      [AuthLevel.VOLUNTEER],
      undefined,
      [AuthLevel[AuthLevel.PARTICIPANT]],
    );
    super.addRBAC(
      [this.READ, this.UPDATE, this.CREATE],
      [AuthLevel.PARTICIPANT],
    );
  }

  public delete(id: UidType): Promise<IDbResult<void>> {
    // TODO: Will need to be implemented for GDPR compliance
    throw new MethodNotImplementedError('Cannot delete a pre-registration yet');
  }

  public get(id: UidType, opts?: IUowOpts): Promise<IDbResult<PreRegistration>> {
    let queryBuilder = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(this.tableName);
    if (opts && opts.fields) {
      queryBuilder = queryBuilder.fields(opts.fields);
    }
    queryBuilder = queryBuilder
      .where(`${this.pkColumnName}= ?`, id);
    const query = queryBuilder.toParam();
    query.text = query.text.concat(';');
    return from(this.sql.query<PreRegistration>(
      query.text,
      query.values,
      { stream: false, cache: true },
    ))
      .pipe(
        map((event: PreRegistration) => ({ result: 'Success', data: event })),
      )
      .toPromise();
  }

  public async getAll(opts?: IUowOpts): Promise<IDbResult<Stream<PreRegistration>>> {
    const query = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from(this.tableName)
      .where(
        'hackathon = ?',
        await (opts && opts.hackathon ?
          Promise.resolve(opts.hackathon) :
          this.activeHackathonDataMapper.activeHackathon.pipe(map(hackathon => hackathon.uid))
            .toPromise()),
      )
      .toString()
      .concat(';');
    return from(this.sql.query<PreRegistration>(query, [], { stream: true, cache: true }))
      .pipe(
        map((event: Stream<PreRegistration>) => ({ result: 'Success', data: event })),
      )
      .toPromise();
  }

  public getCount(): Promise<IDbResult<number>> {
    const query = this.getCountQuery().toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query<number>(query.text, query.values, { stream: true, cache: true }),
    ).pipe(
      map((result: number) => ({ result: 'Success', data: result })),
    ).toPromise();
  }

  public getCountQuery() {
    const query = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: false })
      .from(this.tableName)
      .field(`COUNT(${this.pkColumnName})`, 'preregistration_count');
    return query;
  }

  public async insert(object: PreRegistration): Promise<IDbResult<PreRegistration>> {
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
      this.sql.query<void>(query.text, query.values, { stream: false, cache: false }),
    ).pipe(
      map(() => ({ result: 'Success', data: object.cleanRepresentation })),
    ).toPromise();
  }

  public update(object: PreRegistration): Promise<IDbResult<PreRegistration>> {
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
      map(() => ({ result: 'Success', data: object.cleanRepresentation })),
    ).toPromise();
  }
}
