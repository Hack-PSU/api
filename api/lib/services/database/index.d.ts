import { Stream } from 'stream';

export interface IDataMapper {
  get(object: any): any;

  insert(object: any): any;

  update(object: any): any;

  delete(object: any): any;

  getAll(): Promise<IDbResult<Stream>>;

  getCount(): any;
}

export interface IDbResult<T> {
  result: string;
  data: T;
}
