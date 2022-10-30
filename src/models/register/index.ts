import * as squel from 'squel';
import { UidType } from '../../JSCommon/common-types';
import { IDataMapper, IDataMapperHackathonSpecific, IDbResult } from '../../services/database';
import { IUowOpts } from '../../services/database/svc/uow.service';
import { Hackathon } from '../hackathon';
import { PreRegistration } from './pre-registration';
import { IRegistrationStats, Registration } from './registration';

export interface IRegisterDataMapper
  extends IDataMapperHackathonSpecific<Registration | Registration[]> {

  tableName: string;

  submit(object: Registration): Promise<IDbResult<boolean>>;

  getCurrent(id: UidType, opts?: IUowOpts): Promise<IDbResult<Registration>>;

  getRegistrationStats(opts?: IUowOpts): Promise<IDbResult<IRegistrationStats[]>>;

  getEmailByUid(uid: UidType): Promise<IDbResult<string>>;

  getRegistrationByEmail(email: String, hackathonUid: UidType): Promise<IDbResult<Registration>>;

  deleteUser(uid: UidType): Promise<IDbResult<void>>;

  /**
   * Returns a generated query for counting the statistics for
   * a given table column
   */
  getSelectQueryForOptionName(fieldname: string, opts?: IUowOpts): Promise<squel.Select>;

  getCountQuery(opts?: IUowOpts): Promise<squel.Select>;

  getByPin(pin: number, hackathonUid: UidType): Promise<IDbResult<Registration>>;

  getByWordPin(pin: string, hackathonUid: UidType): Promise<IDbResult<Registration>>;
}

export interface IPreRegisterDataMapper extends IDataMapper<PreRegistration> {
  getCountQuery(opts?: IUowOpts): Promise<squel.Select>;
}

// export * from './registration';
// export {
//   IRegisterDataMapper,
//   IPreRegisterDataMapper,
//   PreRegisterDataMapperImpl,
//   RegisterDataMapperImpl,
// };
