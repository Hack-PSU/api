import { UidType } from '../../JSCommon/common-types';
import { IUowOpts } from '../../services/database/svc/uow.service';

interface IStatUowOpts extends IUowOpts {
  uid?: UidType;
}

export { IStatUowOpts };
