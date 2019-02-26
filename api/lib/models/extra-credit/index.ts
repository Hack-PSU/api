import { IDataMapperHackathonSpecific, IDbResult } from '../../services/database';
import { IUowOpts } from '../../services/database/svc/uow.service';
import { ExtraCreditAssignment } from './extra-credit-assignment';
import { ExtraCreditClass } from './extra-credit-class';

interface IExtraCreditDataMapper extends IDataMapperHackathonSpecific<ExtraCreditAssignment> {

  getAllClasses(opts?: IUowOpts): Promise<IDbResult<ExtraCreditClass[]>>;
}

export { IExtraCreditDataMapper };
