import { UidType } from '../../JSCommon/common-types';
import { IUowOpts } from './svc/uow.service';

export interface IDataMapper<T> {
  tableName: string;

  get(object: UidType, opts?: IUowOpts): Promise<IDbResult<T>>;

  insert(object: T): Promise<IDbResult<T>>;

  update(object: T): Promise<IDbResult<T>>;

  delete(object: T | UidType): Promise<IDbResult<void>>;

  getAll(opts?: IUowOpts): Promise<IDbResult<T[]>>;

  getCount(opts?: IUowOpts): Promise<IDbResult<number>>;
}

export interface IDbResult<T> {
  result: string;
  data: T;
}
