import * as squel from 'squel';
import { IDataMapper } from '../../services/database';
import { IUowOpts } from '../../services/database/svc/uow.service';
import { Rsvp } from './rsvp';

interface IRsvpDataMapper extends IDataMapper<Rsvp> {

  // To Be Done
  // rsvpStatus (id: UidType): Promise<IDbResult<boolean>>;
  getCountQuery(opts?: IUowOpts): Promise<squel.Select>;
}

export {
  IRsvpDataMapper,
};
