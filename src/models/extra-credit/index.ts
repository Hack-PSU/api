import { UidType } from '../../JSCommon/common-types';
import { IDataMapper, IDbResult } from '../../services/database';
import { IUowOpts } from '../../services/database/svc/uow.service';
import { ExtraCreditAssignment } from './extra-credit-assignment';
import { ExtraCreditClass } from './extra-credit-class';

interface IExtraCreditDataMapper extends IDataMapper<ExtraCreditAssignment> {

  getAllClasses(hackathon?: string, opts?: IUowOpts): Promise<IDbResult<ExtraCreditClass[]>>;

  getByUser(userId: UidType, opts?: IUowOpts): Promise<IDbResult<ExtraCreditAssignment[]>>;

  getByClass(cid: number, opts?: IUowOpts): Promise<IDbResult<ExtraCreditAssignment[]>>;

  deleteByUser(user_id: UidType, hackathon?: UidType): Promise<IDbResult<void>>;

  insertClass(object: ExtraCreditClass): Promise<IDbResult<ExtraCreditClass>>;

}

export { IExtraCreditDataMapper };
