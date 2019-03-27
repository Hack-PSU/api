import { ICompoundHackathonUidType, Omit, UidType } from '../../JSCommon/common-types';
import BaseObject from '../../models/BaseObject';
import { ObjectFactory } from '../../models/object-factory';
import { IUowOpts } from './svc/uow.service';

export interface IDataMapper<T extends BaseObject> {
  tableName: string;

  factory: ObjectFactory<T>;

  get(object: UidType, opts?: IUowOpts): Promise<IDbResult<IApiModel<T>>>;

  insert(object: T): Promise<IDbResult<IApiModel<T>>>;

  update(object: T): Promise<IDbResult<IApiModel<T>>>;

  delete(object: T | UidType): Promise<IDbResult<void>>;

  getAll(opts?: IUowOpts): Promise<IDbResult<Array<IApiModel<T>>>>;

  getCount(opts?: IUowOpts): Promise<IDbResult<number>>;
}

export interface IDataMapperHackathonSpecific<T extends BaseObject>
  extends Omit<IDataMapper<T>, 'delete' | 'get'> {
  delete(object: ICompoundHackathonUidType): Promise<IDbResult<void>>;

  get(object: ICompoundHackathonUidType, opts?: IUowOpts): Promise<IDbResult<T>>;
}

export interface IDbResult<T> {
  result: string;
  data: T;
}

export interface IDbReadable<T> {
  generateFromDbRepresentation(data: any): T;
}

export interface IDbWritable<T> {
  generateDbRepresentation(data: T): any;
}

export interface IApiReadable<T> {
  generateFromApi(data: IApiModel<T>): T;
}

export interface IApiWritable<T> {
  generateApiRepresentation(data: T): IApiModel<T>;
}

export interface IApiModel<T> {
  magicNumber: number;
}
