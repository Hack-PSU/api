import { Stream } from 'stream';
import { IDataMapper, IDbResult } from '../../services/database';
import { Update } from './Update';

export interface IUpdateDataMapper extends IDataMapper {
  get(id: UpdateIdType): Promise<IDbResult<Update>>;

  insert(object: Update): Promise<IDbResult<Update>>;

  update(object: Update): Promise<IDbResult<Update>>;

  delete(id: UpdateIdType): Promise<IDbResult<void>>;

  getAll(): Promise<IDbResult<Stream>>;

  getCount(): Promise<IDbResult<number>>;
}

export type UpdateIdType = string;
