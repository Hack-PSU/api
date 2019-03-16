import { IDataMapper, IDbResult } from '../../services/database';
import { IUowOpts } from '../../services/database/svc/uow.service';
import { ExtraCreditAssignment } from './extra-credit-assignment';
import { ExtraCreditClass } from './extra-credit-class';
import { UidType } from 'JSCommon/common-types';

interface IExtraCreditDataMapper extends IDataMapper<ExtraCreditAssignment> {

  getAllClasses(opts?: IUowOpts): Promise<IDbResult<ExtraCreditClass[]>>;

  getByUser(userId: UidType, opts?: IUowOpts): Promise<IDbResult<ExtraCreditAssignment[]>>;

  getByClass(cid: number, opts?: IUowOpts): Promise<IDbResult<ExtraCreditAssignment[]>>;

}

export { IExtraCreditDataMapper };
