import { Stream } from 'ts-stream';
import { IDataMapper, IDbResult } from '../../services/database';
import { Update } from './update';

export interface IUpdateDataMapper extends IDataMapper {
  get(id: UpdateIdType): Promise<IDbResult<Update>>;

  insert(object: Update): Promise<IDbResult<Update>>;

  update(object: Update): Promise<IDbResult<Update>>;

  delete(id: UpdateIdType): Promise<IDbResult<void>>;

  getAll(): Promise<IDbResult<Stream<Update>>>;

  getCount(): Promise<IDbResult<number>>;

  getReference(): Promise<IDbResult<string>>;
}

export type UpdateIdType = string;
