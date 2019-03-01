import { EpochNumber } from '../../JSCommon/common-types';
import { IDataMapperHackathonSpecific, IDbResult } from '../../services/database';
import { CheckoutObject } from './checkout-object';

export interface ICheckoutObjectDataMapper extends IDataMapperHackathonSpecific<CheckoutObject> {
  returnItem(returnTime: EpochNumber, uid: number): Promise<IDbResult<void>>;
}
