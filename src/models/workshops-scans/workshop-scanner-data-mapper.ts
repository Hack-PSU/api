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

  getEvent(event_id: number): Promise<IDbResult<Event>>;

 }
@Injectable()
export class WorkshopDataMapperImpl extends GenericDataMapper
  implements IAclPerm, IWorkshopAclPerm, IWorkshopScansDataMapper {

  get tableName() {
    return this.TABLE_NAME;
  }

  public readonly CREATE: string = 'attendance:create';
  public readonly DELETE: string = 'attendance:delete';
  public readonly READ: string = 'attendance:read';
  public readonly UPDATE: string = 'attendance:update';
  public readonly READ_ALL: string = 'attendance:readall';
  public readonly COUNT: string = 'attendance:count';
  public readonly CHECK_IN: string = 'workshop:checkin';
  
  protected readonly pkColumnName: string = 'uid';
  protected readonly TABLE_NAME = 'ATTENDANCE';

  constructor(
    @Inject('IAcl') acl: IAcl,
    @Inject('MysqlUow') protected readonly sql: MysqlUow,
    @Inject('IActiveHackathonDataMapper') protected readonly activeHackathonDataMapper: IActiveHackathonDataMapper,
    @Inject('IRegisterDataMapper') protected readonly registerDataMapper: IRegisterDataMapper,
    @Inject('BunyanLogger') protected readonly logger: Logger,
  ) {
    super(acl);
    super.addRBAC(
      [this.READ, this.READ_ALL],
      [AuthLevel.TECHNOLOGY],
    );
    // team member verification is required to check in to a workshop
    super.addRBAC(
      [this.CHECK_IN],
      [AuthLevel.TEAM_MEMBER]
    )
  }

  // TODO: Should probably move this to the Registration mapper instead
  public async getByPin(pin: number, hackathon: Hackathon): Promise<IDbResult<Registration>> {
    const query = squel.select({
      autoQuoteFieldNames: false,
      autoQuoteTableNames: true,
    })
      .from(this.tableName)
      .where('hackathon = ?', hackathon.uid)
      .where('pin = ?', hackathon.base_pin! + pin)
      .toParam();
    return from(this.sql.query<Registration>(
      query.text,
      query.values,
      { cache: true },
    ))
      .pipe(
        map((registration: Registration[]) => ({ result: 'Success', data: registration[0] })),
      )
      .toPromise();
  }

  public async getEvent(event_id: number): Promise<IDbResult<Event>> {
    // remove this when you write the function
    //throw new MethodNotImplementedError('VSCode, stop yelling at me before the function is finished');
    const query = squel.select({
      autoQuoteFieldNames: false,
      autoQuoteTableNames: true,
    })
      .from("EVENTS")
      .where('uid = ?', event_id)
      .toParam();
    return from(this.sql.query<Event>(
      query.text,
      query.values,
      { cache: true },
    ))
      .pipe(
        map((registration: Event[]) => ({ result: 'Success', data: event[0]})),
      )
      .toPromise();
    // construct query

    // execute query and return result
    
  }

  public insert(object: WorkshopScan): Promise<IDbResult<WorkshopScan>> {
    // remove this when you write the function
    //throw new MethodNotImplementedError('VSCode, stop yelling at me before the function is finished');
    
    // construct query 
    /*squel.insert()
    .into(this.tableName)
    .setFieldsRows([object.dbRepresentation])*/
    const query = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(this.tableName)
      .setFieldsRows([object.dbRepresentation])
      .set(
        'hackathon',
        await this.activeHackathonDataMapper.activeHackathon.pipe(map(hackathon => hackathon.uid))
          .toPromise(),
      )
      .set("event_id", req.query.event_id)
      .set("hackathon_id", hackathon)
      .set("timestamp", Date.now())
      .set("user_pin", req.query.pin);
      .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query<void>(query.text, query.values, { cache: false }),
    ).pipe(
      map(() => ({ result: 'Success', data: object.cleanRepresentation })),
    ).toPromise();
  }
    // You can find a pretty close example of how to finish this in src/models/register/register-data-mapper-impl.ts
    
    // I left this here in case you needed it because you had started to write it in the other file.
    // However, it's probably better and more concise to use setFieldsRows([object.dbRepresentation]) instead
    // .set("event_id", req.query.event_id)
    // .set("hackathon_id", hackathon)
    // .set("timestamp", Date.now())
    // .set("user_pin", req.query.pin);

    // execute query and return result

  }


  /**
   *
   * @param opts?
   * @return {Promise<Stream>}
   */
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
