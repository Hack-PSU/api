import { Inject } from 'injection-js';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';
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
import { Hackathon } from './hackathon';
import { IHackathonDataMapper } from './index';
import * as squel from 'squel'

export class HackathonDataMapperImpl extends GenericDataMapper
  implements IHackathonDataMapper, IAclPerm {

  public readonly CREATE: string = 'hackathon:create';
  public readonly DELETE: string = 'hackathon:delete';
  public readonly READ: string = 'hackathon:read';
  public readonly UPDATE: string = 'hackathon:update';
  public readonly READ_ALL: string = 'hackathon:readall';
  public tableName: string = 'HACKATHON';

  protected pkColumnName: string = 'uid';

  constructor(
    @Inject('IAcl') acl: IAcl,
    @Inject('MysqlUow') protected readonly sql: MysqlUow,
    @Inject('BunyanLogger') protected readonly logger: Logger,
  ) {
    super(acl);
    super.addRBAC(
      [this.CREATE, this.UPDATE],
      [AuthLevel.DIRECTOR, AuthLevel.TECHNOLOGY],
    );
    super.addRBAC([this.DELETE], [AuthLevel.TECHNOLOGY]);
    super.addRBAC(
      [this.READ, this.READ_ALL],
      [
        AuthLevel.PARTICIPANT,
        AuthLevel.VOLUNTEER,
        AuthLevel.TEAM_MEMBER,
        AuthLevel.DIRECTOR,
        AuthLevel.TECHNOLOGY,
      ],
    );
  }

  public delete(id: UidType): Promise<IDbResult<void>> {
    throw new MethodNotImplementedError('Cannot delete Hackathon entry yet');
  }

  public get(id: UidType, opts?: IUowOpts): Promise<IDbResult<Hackathon>> {
    let queryBuilder = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(this.tableName);
    if (opts && opts.fields) {
      queryBuilder = queryBuilder.fields(opts.fields);
    }
    queryBuilder = queryBuilder
      .where(`${this.pkColumnName}= ?`, id);
    const query = queryBuilder.toParam();
    query.text = query.text.concat(';');
    return from(this.sql.query<Hackathon>(query.text, query.values, { stream: false, cache: true }))
      .pipe(
        map((event: Hackathon) => ({ result: 'Success', data: event })),
      )
      .toPromise();
  }

  public getAll(): Promise<IDbResult<Stream<Hackathon>>> {
    const query = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from(this.tableName)
      .toString()
      .concat(';');
    return from(this.sql.query<Hackathon>(query, [], { stream: true, cache: true }))
      .pipe(
        map((event: Stream<Hackathon>) => ({ result: 'Success', data: event })),
      )
      .toPromise();
  }

  public getCount(): Promise<IDbResult<number>> {
    const query = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: false })
      .from(this.tableName)
      .field(`COUNT(${this.pkColumnName})`, 'count')
      .toString()
      .concat(';');
    const params = [];
    return from(
      this.sql.query<number>(query, params, { stream: true, cache: true }),
    ).pipe(
      map((result: number) => ({ result: 'Success', data: result })),
    ).toPromise();
  }

  public insert(object: Hackathon): Promise<IDbResult<Hackathon>> {
    const validation = object.validate();
    if (!validation.result) {
      this.logger.warn('Validation failed while adding object.');
      this.logger.warn(object.dbRepresentation);
      return Promise.reject({ result: 'error', data: new HttpError(validation.error, 400) });
    }
    const query = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(this.tableName)
      .setFieldsRows([object.dbRepresentation])
      .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query<void>(query.text, query.values, { stream: false, cache: false }),
    ).pipe(
      map(() => ({ result: 'Success', data: object })),
    ).toPromise();
  }

  public update(object: Hackathon): Promise<IDbResult<Hackathon>> {
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
}
