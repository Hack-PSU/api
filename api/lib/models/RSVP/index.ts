import { UidType } from '../../JSCommon/common-types';
import { IDataMapper, IDbResult } from '../../services/database';
import { RSVP } from './RSVP';
import { RSVPDataMapperImpl } from './RSVP-data-mapper-impl';

interface IRSVPDataMapper extends IDataMapper < RSVP > {

  tableName: string;

  rsvpStatus (id: UidType): Promise<IDbResult<boolean>>;

}

export {
  RSVP,
  IRSVPDataMapper,
  RSVPDataMapperImpl,
};
