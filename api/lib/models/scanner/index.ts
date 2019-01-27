import { IDataMapper, IDbResult } from '../../services/database';
import { RfidAssignment } from './rfid-assignment';

interface IScannerDataMapper extends IDataMapper<RfidAssignment> {

  addRfidAssignments(assignments: RfidAssignment[]): Promise<IDbResult<RfidAssignment>[]>;
}

export { IScannerDataMapper };
