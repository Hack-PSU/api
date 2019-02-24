import * as squel from 'squel';
import { IDataMapperHackathonSpecific, IDbResult } from '../../services/database';
import { IUowOpts } from '../../services/database/svc/uow.service';
import { RfidAssignment } from './rfid-assignment';

interface IScannerDataMapper extends IDataMapperHackathonSpecific<RfidAssignment> {

  addRfidAssignments(assignments: RfidAssignment[]): Promise<IDbResult<Array<IDbResult<RfidAssignment>>>>;

  getCountQuery(opts?: IUowOpts): Promise<squel.Select>;
}

export { IScannerDataMapper };
