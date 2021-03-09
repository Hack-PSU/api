import { IDataMapper, IDbResult } from '../../services/database';
import { Url } from './url';

interface IUrlDataMapper extends IDataMapper<Url> {

  deleteByEvent(eventId: string): Promise<IDbResult<void>>;

  getByEvent(eventId: string): Promise<IDbResult<Url[]>>;

}

export { IUrlDataMapper };
