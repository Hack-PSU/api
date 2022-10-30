import { Inject, Injectable } from 'injection-js';
import { default as _ } from 'lodash';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import * as squel from 'squel';
import { MethodNotImplementedError } from '../../JSCommon/errors';
import { AuthLevel } from '../../services/auth/auth-types';
import { IAcl, IAclPerm, IWorkshopAclPerm } from '../../services/auth/RBAC/rbac-types';
import { IDataMapper, IDbResult } from '../../services/database';
import { GenericDataMapper } from '../../services/database/svc/generic-data-mapper';
import { MysqlUow } from '../../services/database/svc/mysql-uow.service';
import { IUowOpts } from '../../services/database/svc/uow.service';
import { Logger } from '../../services/logging/logging';
import { IActiveHackathonDataMapper } from '../hackathon/active-hackathon';
import { IRegisterDataMapper } from '../register';
import { WorkshopScan } from './workshop-scans';
import { Hackathon } from 'models/hackathon';
import { Registration } from 'models/register/registration';

/**
 * TODO: Add documentation
 */

 export interface IWorkshopScansDataMapper extends IDataMapper<WorkshopScan> {
  
  getByPin(pin: number, hackathon: Hackathon): Promise<IDbResult<Registration>>;

  deleteUser(emaill: string): Promise<IDbResult<void>>;

 }
@Injectable()
export class WorkshopDataMapperImpl extends GenericDataMapper
  implements IAclPerm, IWorkshopAclPerm, IWorkshopScansDataMapper {

  get tableName() {
    return this.TABLE_NAME;
  }

  public readonly READ: string = 'registration:read';
  public readonly CREATE: string = 'attendance:create';
  public readonly DELETE: string = 'attendance:delete';
  public readonly READ_ALL: string = 'registration:read';
  public readonly UPDATE: string = 'attendance:create';
  public readonly COUNT: string = 'attendance:count';

  public readonly CHECK_IN: string = 'workshop:checkin';
  
  protected readonly pkColumnName: string = 'uid';
  protected readonly TABLE_NAME = 'WORKSHOP_SCANS';

  constructor(
    @Inject('IAcl') acl: IAcl,
    @Inject('MysqlUow') protected readonly sql: MysqlUow,
    @Inject('IActiveHackathonDataMapper') protected readonly activeHackathonDataMapper: IActiveHackathonDataMapper,
    @Inject('IRegisterDataMapper') protected readonly registerDataMapper: IRegisterDataMapper,
    @Inject('BunyanLogger') protected readonly logger: Logger,
  ) {
    super(acl);
    // super.addRBAC(
    //   [this.READ, this.READ_ALL],
    //   [AuthLevel.TECHNOLOGY],
    // );
    // team member verification is required to check in to a workshop
    super.addRBAC(
      [this.CHECK_IN],
      [AuthLevel.TEAM_MEMBER]
    )
  }

  deleteUser(email: string): Promise<IDbResult<void>> {
    const query = squel.delete({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(this.tableName)
      .where('email = ?', email)
      .toParam();
      return from(this.sql.query(query.text, query.values, { cache: false }))
        .pipe(map(() => ({ result: 'Success', data: undefined })))
        .toPromise();
  }

  // TODO: Should probably move this to the Registration mapper instead
  public async getByPin(pin: number, hackathon: Hackathon): Promise<IDbResult<Registration>> {
    const query = squel.select({
      autoQuoteFieldNames: false,
      autoQuoteTableNames: true,
    })
      .from('REGISTRATION')
      .where('hackathon = ?', hackathon.uid)
      .where('pin = ?', hackathon.base_pin! + pin)
      .toParam();
    return from(this.sql.query<Registration>(
      query.text,
      query.values,
      { cache: false },
    ))
      .pipe(
        map((registration: Registration[]) => ({ result: 'Success', data: registration[0] })),
      )
      .toPromise();
  }

  public async insert(object: WorkshopScan): Promise<IDbResult<WorkshopScan>> {
    const query = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(this.tableName)
      .setFieldsRows([object.dbRepresentation])
      .set(
        'hackathon_id',
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
    
  //Unsupported methods, but forced to be created
  public async getAll(opts?: IUowOpts): Promise<IDbResult<WorkshopScan[]>> {
    throw new MethodNotImplementedError('This method is not supported by this class');
  }

  public async getCount(opts?: IUowOpts): Promise<IDbResult<number>> {
    throw new MethodNotImplementedError('This method is not supported by this class');
  }

  public get(uid: string, opts?: IUowOpts): Promise<IDbResult<WorkshopScan>> {
    throw new MethodNotImplementedError('This method is not supported by this class');
  }

  public update(object: WorkshopScan, opts?: IUowOpts): Promise<IDbResult<WorkshopScan>> {
    throw new MethodNotImplementedError('This method is not supported by this class');
  }

  public delete(uid: string, opts?: IUowOpts): Promise<IDbResult<void>> {
    throw new MethodNotImplementedError('This method is not supported by this class');
  }

}
