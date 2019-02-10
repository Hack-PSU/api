import { Stream } from 'ts-stream';
import { UidType } from '../../JSCommon/common-types';
import { IDataMapper, IDbResult } from '../../services/database';
import { Location } from './location';
//
// interface IEventDataMapper extends IDataMapper {
//   get(id: UidType): Promise<IDbResult<Event>>;
//
//   insert(object: Event): Promise<IDbResult<Event>>;
//
//   update(object: Event): Promise<IDbResult<Event>>;
//
//   delete(id: UidType): Promise<IDbResult<void>>;
//
//   getAll(): Promise<IDbResult<Stream<Event>>>;
//
//   getCount(): Promise<IDbResult<number>>;
// }

export { Location };
