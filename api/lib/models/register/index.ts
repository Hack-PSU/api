import { Stream } from 'ts-stream';
import { UidType } from '../../JSCommon/common-types';
import { IDataMapper, IDbResult } from '../../services/database';
import { PreRegisterDataMapperImpl } from './pre-register-data-mapper-impl';
import { PreRegistration } from './pre-registration';
import { RegisterDataMapperImpl } from './register-data-mapper-impl';
import { Registration } from './registration';

interface IRegisterDataMapper extends IDataMapper {

  tableName: string;

  insert(object: Registration): Promise<IDbResult<Registration>>;

  update(object: Registration): Promise<IDbResult<Registration>>;

  submit(object: Registration): Promise<IDbResult<boolean>>;

  delete(id: UidType): Promise<IDbResult<void>>;

  get(id: UidType): Promise<IDbResult<Registration[]>>;

  getAll(): Promise<IDbResult<Stream<Registration>>>;

  getCurrent(id: UidType): Promise<IDbResult<Registration>>;

  getCount(): Promise<IDbResult<number>>;

}

interface IPreRegisterDataMapper extends IDataMapper {
  get(id: UidType): Promise<IDbResult<PreRegistration>>;

  insert(object: PreRegistration): Promise<IDbResult<PreRegistration>>;

  update(object: PreRegistration): Promise<IDbResult<PreRegistration>>;

  delete(id: UidType): Promise<IDbResult<void>>;

  getAll(): Promise<IDbResult<Stream<PreRegistration>>>;

  getCount(): Promise<IDbResult<number>>;
}

export * from './registration';
export {
  IRegisterDataMapper,
  IPreRegisterDataMapper,
  PreRegisterDataMapperImpl,
  RegisterDataMapperImpl,
};
