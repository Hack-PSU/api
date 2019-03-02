import * as squel from 'squel';
import { IDataMapperHackathonSpecific, IDbResult } from '../../services/database';
import { IUowOpts } from '../../services/database/svc/uow.service';
import { RfidAssignment } from './rfid-assignment';
import { Scan } from './scan';

interface IScannerDataMapper extends IDataMapperHackathonSpecific<RfidAssignment> {

  addRfidAssignments(assignments: RfidAssignment[]): Promise<IDbResult<Array<IDbResult<RfidAssignment>>>>;

  getCountQuery(opts?: IUowOpts): Promise<squel.Select>;

  addScans(scans: Scan[]): Promise<IDbResult<Array<IDbResult<Scan>>>>;

  addSingleScan(scan: Scan): Promise<IDbResult<Scan>>;

  getAllScans(opts?: IUowOpts): Promise<IDbResult<Scan[]>>;
}

export { IScannerDataMapper };
