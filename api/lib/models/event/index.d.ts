import { IDataMapper, IDbResult } from '../../services/database';
import { Event } from './Event';
import { Stream } from 'stream';

export interface IEventDataMapper extends IDataMapper {
  get(id: EventIdType): Promise<IDbResult<Event>>;

  insert(object: Event): Promise<IDbResult<Event>>;

  update(object: Event): Promise<IDbResult<Event>>;

  delete(id: EventIdType): Promise<IDbResult<void>>;

  getAll(): Promise<IDbResult<Stream>>;

  getCount(): Promise<IDbResult<number>>;
}

export type EventIdType = string;
