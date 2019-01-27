import { Stream } from 'ts-stream';
import { IDataMapper, IDbResult } from '../../services/database';
import { IUowOpts } from '../../services/database/svc/uow.service';
import { ExtraCreditAssignment } from './extra-credit-assignment';
import { ExtraCreditClass } from './extra-credit-class';

interface IExtraCreditDataMapper extends IDataMapper<ExtraCreditAssignment> {

  getAllClasses(opts?: IUowOpts): Promise<IDbResult<Stream<ExtraCreditClass>>>;
}

export { IExtraCreditDataMapper };
