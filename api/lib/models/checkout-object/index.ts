import { EpochNumber } from '../../JSCommon/common-types';
import { IDataMapper, IDbResult } from '../../services/database';
import { CheckoutObject } from './checkout-object';

export interface ICheckoutObjectDataMapper extends IDataMapper<CheckoutObject> {
  returnItem(returnTime: EpochNumber, uid: number): Promise<IDbResult<void>>;
}
