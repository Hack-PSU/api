import { IDataMapperHackathonSpecific, IDbResult } from '../../services/database';
import { Update } from './update';

export interface IUpdateDataMapper extends IDataMapperHackathonSpecific<Update> {
  getReference(): Promise<IDbResult<string>>;
}

export type UpdateIdType = string;
