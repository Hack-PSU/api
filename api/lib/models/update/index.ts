import { Stream } from 'ts-stream';
import { IDataMapper, IDbResult } from '../../services/database';
import { Update } from './update';

export interface IUpdateDataMapper extends IDataMapper<Update> {
  getReference(): Promise<IDbResult<string>>;
}

export type UpdateIdType = string;
