import { Inject, ReflectiveInjector } from 'injection-js';
import Timeuuid from 'node-time-uuid';
import { from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Stream } from 'ts-stream';
import { IUpdateDataMapper, UpdateIdType } from '.';
import { HttpError } from '../../JSCommon/errors';
import { AuthLevel } from '../../services/auth/auth-types';
import { RBAC } from '../../services/auth/RBAC/rbac';
import { IAclPerm } from '../../services/auth/RBAC/rbac-types';
import { IDbResult } from '../../services/database';
import { GenericDataMapper } from '../../services/database/svc/generic-data-mapper';
import { MysqlUow } from '../../services/database/svc/mysql-uow.service';
import { RtdbQueryType, RtdbUow } from '../../services/database/svc/rtdb-uow.service';
import { IUowOpts } from '../../services/database/svc/uow.service';
import { Logger } from '../../services/logging/logging';
import { IActiveHackathonDataMapper } from '../hackathon/active-hackathon';
import { Update } from './update';

export class UpdateDataMapperImpl extends GenericDataMapper implements IUpdateDataMapper, IAclPerm {
  public readonly CREATE: string = 'event:create';
  public readonly DELETE: string = 'event:delete';
  public readonly READ: string = 'event:read';
  public readonly UPDATE: string = 'event:update';
  public readonly READ_ALL: string = 'event:readall';

  protected pkColumnName = '';
  protected tableName = '';

  constructor(
    @Inject('MysqlUow') private readonly sql: MysqlUow,
    @Inject('RtdbUow') private readonly rtdb: RtdbUow,
    @Inject('BunyanLogger') private readonly logger: Logger,
    @Inject('IActiveHackathonDataMapper') private readonly activeHackathonDataMapper: IActiveHackathonDataMapper,
  ) {
    super(ReflectiveInjector.resolveAndCreate([RBAC]).get(RBAC));
    super.addRBAC(
      [this.CREATE, this.UPDATE, this.DELETE],
      [AuthLevel.TEAM_MEMBER, AuthLevel.DIRECTOR, AuthLevel.TECHNOLOGY],
    );
    super.addRBAC(
      [this.READ_ALL, this.READ],
      [
        AuthLevel.PARTICIPANT,
        AuthLevel.VOLUNTEER,
        AuthLevel.TEAM_MEMBER,
        AuthLevel.DIRECTOR,
        AuthLevel.TECHNOLOGY,
      ],
    );
  }

  public delete(id: UpdateIdType): Promise<IDbResult<void>> {
    return this.activeHackathonDataMapper.activeHackathon
      .pipe(
        switchMap(reference => this.rtdb.query<void>(
          RtdbQueryType.DELETE,
          `${reference}/${id}`,
          { stream: false, cache: false },
        )),
        map(() => ({ result: 'Success', data: undefined })),
      )
      .toPromise();
  }

  public get(id: UpdateIdType, opts?: IUowOpts): Promise<IDbResult<Update>> {
    return this.activeHackathonDataMapper.activeHackathon
      .pipe(
        switchMap(reference => this.rtdb.query<Update>(
          RtdbQueryType.GET,
          `${reference}/${id}`,
          { stream: true, cache: true },
        )),
        map(result => ({ result: 'Success', data: result as Update })),
      ).toPromise();
  }

  public getAll(): Promise<IDbResult<Stream<Update>>> {
    return this.activeHackathonDataMapper.activeHackathon
      .pipe(
        switchMap((result) => {
          const reference = `/updates/${result[0].uid}`;
          return from(this.rtdb.query<Stream<Update>>(RtdbQueryType.GET, reference, undefined));
        }),
        map((data) => ({ result: 'Success', data: data as Stream<Update> })),
      ).toPromise();
  }

  public getCount(): Promise<IDbResult<number>> {
    return this.activeHackathonDataMapper.activeHackathon
      .pipe(
        switchMap((result) => {
          const reference = `/updates/${result[0].uid}`;
          return this.rtdb.query<number>(RtdbQueryType.COUNT, reference, null);
        }),
        map((data) => ({ result: 'Success', data: data as number })),
      ).toPromise();
  }

  public insert(object: Update): Promise<IDbResult<Update>> {
    const validation = object.validate();
    if (!validation.result) {
      return Promise.reject(new Error(validation.error));
    }
    const uid = new Timeuuid().toString();
    return this.activeHackathonDataMapper.activeHackathon
      .pipe(
        switchMap(reference => from(
          this.rtdb.query<Update>(
            RtdbQueryType.SET,
            `${reference[0].uid}/${uid}`,
            object.dbRepresentation,
          ),
        )),
        map(result => ({ result: 'Success', data: result as Update })),
      ).toPromise();
  }

  public update(object: Update): Promise<IDbResult<Update>> {
    const validation = object.validate();
    if (!validation.result) {
      this.logger.warn('Validation failed while adding object.');
      this.logger.warn(object.dbRepresentation);
      return Promise.reject({ result: 'error', data: new HttpError(validation.error, 400) });
    }
    return this.activeHackathonDataMapper.activeHackathon.pipe(
      switchMap(reference => from(
        this.rtdb.query<Update>(
          RtdbQueryType.UPDATE,
          `${reference[0].uid}/${object.id}`,
          object.dbRepresentation,
        ))),
      map(result => ({ result: 'Success', data: result as Update })),
    ).toPromise();
  }

  public getReference() {
    return this.activeHackathonDataMapper.activeHackathon.pipe(
      switchMap(result => {
        const reference = `/updates/${result[0].uid}`;
        return from(this.rtdb.query<string>(RtdbQueryType.REF, reference, null));
      }),
      map(result => ({ result: 'Success', data: result as string })),
    )
      .toPromise();
  }
}
