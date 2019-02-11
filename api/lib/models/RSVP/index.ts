// import { UidType } from '../../JSCommon/common-types';
import * as squel from 'squel';
import { IDataMapper } from '../../services/database';
import { IUowOpts } from '../../services/database/svc/uow.service';
import { RSVP } from './RSVP';
import { RSVPDataMapperImpl } from './RSVP-data-mapper-impl';

interface IRSVPDataMapper extends IDataMapper < RSVP > {

  tableName: string;

  // To Be Done
  // rsvpStatus (id: UidType): Promise<IDbResult<boolean>>;

}

export {
  RSVP,
  IRSVPDataMapper,
  RSVPDataMapperImpl,
};
