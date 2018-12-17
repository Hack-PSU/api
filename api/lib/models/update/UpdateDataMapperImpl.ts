import { Inject, ReflectiveInjector } from 'injection-js';
import Timeuuid from 'node-time-uuid';
import { from, Observable } from 'rxjs';
import { map, shareReplay, switchMap } from 'rxjs/operators';
import { Stream } from 'stream';
import { HttpError } from '../../JSCommon/errors';
import { AuthLevel } from '../../services/auth/auth-types';
import { RBAC } from '../../services/auth/RBAC/rbac';
import { IAclPerm } from '../../services/auth/RBAC/rbac-types';
import { IDbResult } from '../../services/database';
import { GenericDataMapper } from '../../services/database/svc/generic-data-mapper';
import { MysqlUow } from '../../services/database/svc/mysql-uow.service';
import { RtdbQueryType, RtdbUow } from '../../services/database/svc/rtdb-uow.service';
import { IUowOpts } from '../../services/database/svc/uow.service';
import { logger } from '../../services/logging/logging';
import { Hackathon } from '../Hackathon';
import { IUpdateDataMapper, UpdateIdType } from './index';
import { Update } from './Update';

export class UpdateDataMapperImpl extends GenericDataMapper implements IUpdateDataMapper, IAclPerm {
  public readonly CREATE: string = 'event:create';
  public readonly DELETE: string = 'event:delete';
  public readonly READ: string = 'event:read';
  public readonly UPDATE: string = 'event:update';

  protected pkColumnName = '';
  protected tableName = '';

  private readonly hackathonObservable: Observable<Array<{ uid: string }>>;

  constructor(@Inject('MysqlUow') private sql: MysqlUow, @Inject('RtdbUow') private rtdb: RtdbUow) {
    super(ReflectiveInjector.resolveAndCreate([RBAC]).get(RBAC));
    super.addRBAC(
      ['update:create', 'update:update', 'update:delete'],
      [AuthLevel.TEAM_MEMBER, AuthLevel.DIRECTOR, AuthLevel.TECHNOLOGY],
    );
    super.addRBAC(
      'update:read',
      [
        AuthLevel.PARTICIPANT,
        AuthLevel.VOLUNTEER,
        AuthLevel.TEAM_MEMBER,
        AuthLevel.DIRECTOR,
        AuthLevel.TECHNOLOGY,
      ],
    );
    const query = Hackathon.getActiveHackathonQuery().toParam();
    this.hackathonObservable = from(this.sql.query(
      query.text,
      query.values,
    ) as Promise<Array<{ uid: string }>>)
      .pipe(shareReplay());
  }

  public delete(id: UpdateIdType): Promise<IDbResult<void>> {
    return this.hackathonObservable
      .pipe(
        switchMap(reference => this.rtdb.query<void>(
          RtdbQueryType.DELETE,
          `${reference}/${id}`,
          { stream: false, cache: false },
        )),
        map(() => ({ result: 'Success',  data: null })),
      )
      .toPromise();
  }

  public get(id: UpdateIdType, opts?: IUowOpts): Promise<IDbResult<Update>> {
    return this.hackathonObservable
      .pipe(
        switchMap(reference => this.rtdb.query<Update>(
          RtdbQueryType.GET,
          `${reference}/${id}`,
          { stream: true, cache: true },
        )),
        map(result => ({ result: 'Success', data: result })),
      ).toPromise();
  }

  public getAll(): Promise<IDbResult<Stream>> {
    return this.hackathonObservable
      .pipe(
        switchMap((result) => {
          const reference = `/updates/${result[0].uid}`;
          return from(this.rtdb.query<Stream>(RtdbQueryType.GET, reference, null));
        }),
        map((data) => ({ result: 'Success', data })),
      ).toPromise();
  }

  public getCount(): Promise<IDbResult<number>> {
    return this.hackathonObservable
      .pipe(
        switchMap((result) => {
          const reference = `/updates/${result[0].uid}`;
          return this.rtdb.query<number>(RtdbQueryType.COUNT, reference, null);
        }),
        map((data) => ({ result: 'Success', data })),
      ).toPromise();
  }

  public insert(object: Update): Promise<IDbResult<Update>> {
    const validation = object.validate();
    if (!validation.result) {
      return Promise.reject(new Error(validation.error));
    }
    const uid = new Timeuuid().toString();
    return this.hackathonObservable
      .pipe(
        switchMap(reference => from(
          this.rtdb.query<Update>(
            RtdbQueryType.SET,
            `${reference[0].uid}/${uid}`,
            object.dbRepresentation,
          ),
        )),
        map(result => ({ result: 'Success', data: result })),
      ).toPromise();
  }

  public update(object: Update): Promise<IDbResult<Update>> {
    const validation = object.validate();
    if (!validation.result) {
      logger.warn('Validation failed while adding object.');
      logger.warn(object.dbRepresentation);
      return Promise.reject({ result: 'error', data: new HttpError(validation.error, 400) });
    }
    return this.hackathonObservable.pipe(
      switchMap(reference => from(
        this.rtdb.query<Update>(
          RtdbQueryType.UPDATE,
          `${reference[0].uid}/${object.id}`,
          object.dbRepresentation,
        ))),
      map(result => ({ result: 'Success', data: result })),
    ).toPromise();
  }

  public getReference() {
    return this.hackathonObservable.pipe(
      switchMap(result => {
        const reference = `/updates/${result[0].uid}`;
        return from(this.rtdb.query<string>(RtdbQueryType.REF, reference, null));
      }),
    )
      .toPromise();
  }
}
