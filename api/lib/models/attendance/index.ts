import { UidType } from '../../JSCommon/common-types';
import { IUowOpts } from '../../services/database/svc/uow.service';

interface IEventStatUowOpts extends IUowOpts {
  event?: UidType;
}

export { IEventStatUowOpts };
