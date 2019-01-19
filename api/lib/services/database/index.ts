import { Stream } from 'ts-stream';
import { UidType } from '../../JSCommon/common-types';
import { IUowOpts } from './svc/uow.service';

export interface IDataMapper<T> {
  get(object: UidType, opts?: IUowOpts): Promise<IDbResult<T>>;

  insert(object: T): Promise<IDbResult<T>>;

  update(object: T): Promise<IDbResult<T>>;

  delete(object: T | UidType): Promise<IDbResult<void>>;

  getAll(opts?: IUowOpts): Promise<IDbResult<Stream<any>>>;

  getCount(opts?: IUowOpts): Promise<IDbResult<number>>;
}

export interface IDbResult<T> {
  result: string;
  data: T;
}
