import { Inject, Injectable } from 'injection-js';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import squel from 'squel';
import tsStream from 'ts-stream';
import { UidType } from '../../../JSCommon/common-types';
import { MethodNotImplementedError } from '../../../JSCommon/errors';
import { AuthLevel, IFirebaseAuthService } from '../../../services/auth/auth-types';
import { IAcl, IAclPerm } from '../../../services/auth/RBAC/rbac-types';
import { IDbResult } from '../../../services/database';
import { GenericDataMapper } from '../../../services/database/svc/generic-data-mapper';
import { MysqlUow } from '../../../services/database/svc/mysql-uow.service';
import { IUowOpts } from '../../../services/database/svc/uow.service';
import { IActiveHackathonDataMapper } from '../../hackathon/active-hackathon';
import { IPreRegisterDataMapper, IRegisterDataMapper } from '../../register';
import { IAdminStatisticsDataMapper, IUserCount, IUserStatistics } from './index';

@Injectable()
export class AdminStatisticsDataMapperImpl extends GenericDataMapper
  implements IAdminStatisticsDataMapper, IAclPerm {
  public READ: string = 'statistics:read';
  // Undefined properties for Statistics data mapper
  public COUNT: string;
  public CREATE: string;
  public DELETE: string;
  public READ_ALL: string;
  public UPDATE: string;
  public tableName: string;
  protected pkColumnName: string;

  constructor(
    @Inject('IAcl') readonly acl: IAcl,
    @Inject('IAuthService') private readonly authService: IFirebaseAuthService,
    @Inject('MysqlUow') private readonly sql: MysqlUow,
    @Inject('IPreRegisterDataMapper') private readonly preRegDataMapper: IPreRegisterDataMapper,
    @Inject('IRegisterDataMapper') private readonly registerDataMapper: IRegisterDataMapper,
    @Inject('IActiveHackathonDataMapper') private readonly hackathonDataMapper: IActiveHackathonDataMapper,
  ) {
    super(acl);
    super.addRBAC(
      this.READ,
      [AuthLevel.TEAM_MEMBER],
      undefined,
      [AuthLevel[AuthLevel.VOLUNTEER]],
    );
  }

  public delete(object: UidType | any): Promise<IDbResult<void>> {
    throw new MethodNotImplementedError('this action is not supported');
  }

  public get(object: UidType, opts?: IUowOpts): Promise<IDbResult<any>> {
    throw new MethodNotImplementedError('this action is not supported');
  }

  public getAll(opts?: IUowOpts): Promise<IDbResult<tsStream<any>>> {
    throw new MethodNotImplementedError('this action is not supported');
  }

  public getCount(opts?: IUowOpts): Promise<IDbResult<number>> {
    throw new MethodNotImplementedError('this action is not supported');
  }

  public insert(object: any): Promise<IDbResult<any>> {
    throw new MethodNotImplementedError('this action is not supported');
  }

  public update(object: any): Promise<IDbResult<any>> {
    throw new MethodNotImplementedError('this action is not supported');
  }

  public async getUserCountByCategory(opts?: IUowOpts): Promise<IDbResult<IUserCount[]>> {
    let query = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from(
        // squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: false })
        //   .from(this.preRegDataMapper.tableName, 'prereg')
        //   .field('COUNT(prereg.uid)', 'pre_count'),
        this.preRegDataMapper.getCountQuery(),
        'a',
      )
      .join(
        await this.registerDataMapper.getCountQuery(opts),
        // squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: false })
        //     .from(this.registerDataMapper.tableName, 'registration')
        //     .field('COUNT(registration.uid)', 'reg_count')
        //     .join(
        //       Hackathon.TABLE_NAME,
        //       'hackathon',
        //       'hackathon.uid = registration.hackathon AND hackathon.active = 1'
        'b',
      )
      .join(
        // TODO: Change to a getCount query from an RSVP data mapper
        squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: false })
          .from('RSVP', 'rsvp')
          .field('COUNT(rsvp.user_id)', 'rsvp_count')
          .join(
            'HACKATHON',
            'hackathon',
            'hackathon.uid = rsvp.hackathon AND hackathon.active = 1',
          ),
        'c',
      )
      .join(
        // TODO: Change to a getCount query from an scanner assignment data mapper
        squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: false })
          .from('RFID_ASSIGNMENTS', 'rfid')
          .field('COUNT(rfid.user_uid)', 'checkin_count')
          .join(
            'HACKATHON',
            'hackathon',
            'hackathon.uid = rfid.hackathon AND hackathon.active = 1',
          ),
        'd',
      )
      .toString();
    query = query.concat(';');
    return from(
      this.sql.query<IUserCount>(query, [], { stream: false, cache: true }),
    ).pipe(
      map((result: IUserCount[]) => ({ result: 'Success', data: result })),
    ).toPromise();
  }

  public async getAllUserData(opts?: IUowOpts): Promise<IDbResult<IUserStatistics[]>> {
    let queryBuilder = squel.select({ autoQuoteFieldNames: false, autoQuoteTableNames: true })
      .distinct()
      .field('pre_reg.uid', 'pre_uid')
      .field('reg.*')
      .field('reg.pin - hackathon.base_pin', 'pin')
      .field('hackathon.name')
      .field('hackathon.start_time')
      .field('hackathon.end_time')
      .field('hackathon.base_pin')
      .field('hackathon.active')
      .field('rsvp.user_id')
      .field('rsvp.rsvp_time')
      .field('rsvp.rsvp_status')
      .field('rfid.user_uid')
      .from(this.preRegDataMapper.tableName, 'pre_reg')
      .right_join(this.registerDataMapper.tableName, 'reg', 'pre_reg.email = reg.email')
      .join(this.hackathonDataMapper.tableName, 'hackathon', 'reg.hackathon = hackathon.uid')
      // TODO: Change to the table name field once rsvp data mapper is created
      .left_join('RSVP', 'rsvp', 'reg.uid = rsvp.user_id')
      // TODO: Change to the table name field once rfid data mapper is created
      .left_join('RFID_ASSIGNMENTS', 'rfid', 'reg.uid = rfid.user_uid');

    if (opts && opts.byHackathon) {
      queryBuilder = queryBuilder
        .where(
          'reg.hackathon = ?',
          await (opts.hackathon ?
            Promise.resolve(opts.hackathon) :
            this.hackathonDataMapper.activeHackathon
              .pipe(map(hackathon => hackathon.uid))
              .toPromise()),
        );
    }
    if (opts && opts.startAt) {
      queryBuilder = queryBuilder.offset(opts.startAt);
    }
    if (opts && opts.count) {
      queryBuilder = queryBuilder.limit(opts.count);
    }
    const query = queryBuilder.toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query<IUserStatistics>(query.text, query.values, { stream: true, cache: true }),
    ).pipe(
      map((result: IUserStatistics[]) => ({ result: 'Success', data: result })),
    ).toPromise();
  }
}
