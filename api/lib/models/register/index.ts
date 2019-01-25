import * as squel from 'squel';
import { UidType } from '../../JSCommon/common-types';
import { IDataMapper, IDbResult } from '../../services/database';
import { IUowOpts } from '../../services/database/svc/uow.service';
import { PreRegisterDataMapperImpl } from './pre-register-data-mapper-impl';
import { PreRegistration } from './pre-registration';
import { RegisterDataMapperImpl } from './register-data-mapper-impl';
import { IRegistrationStats, Registration } from './registration';

interface IRegisterDataMapper extends IDataMapper<Registration | Registration[]> {

  tableName: string;

  submit(object: Registration): Promise<IDbResult<boolean>>;

  getCurrent(id: UidType, opts?: IUowOpts): Promise<IDbResult<Registration>>;

  getStats(opts?: IUowOpts): Promise<IDbResult<IRegistrationStats>>;

  getEmailByUid(uid: UidType): Promise<IDbResult<string>>;

  /**
   * Returns a generated query for counting the statistics for
   * a given table column
   */
  getSelectQueryForOptionName(fieldname: string, opts?: IUowOpts): Promise<squel.Select>;

  normaliseRegistrationData(registration: any): void;

  getCountQuery(opts?: IUowOpts): Promise<squel.Select>;
}

interface IPreRegisterDataMapper extends IDataMapper<PreRegistration> {
  getCountQuery(): squel.Select;
}

// interface IPreRegisterDataMapper extends IDataMapper {
//   get(id: UidType): Promise<IDbResult<PreRegistration>>;
//
//   insert(object: PreRegistration): Promise<IDbResult<PreRegistration>>;
//
//   update(object: PreRegistration): Promise<IDbResult<PreRegistration>>;
//
//   delete(id: UidType): Promise<IDbResult<void>>;
//
//   getAll(): Promise<IDbResult<Stream<PreRegistration>>>;
//
//   getCount(): Promise<IDbResult<number>>;
// }

export * from './registration';
export {
  IRegisterDataMapper,
  IPreRegisterDataMapper,
  PreRegisterDataMapperImpl,
  RegisterDataMapperImpl,
};
