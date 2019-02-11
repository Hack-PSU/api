import { EpochNumber } from '../../JSCommon/common-types';
import { IDataMapper, IDbResult } from '../../services/database';
import { CheckoutObject } from './checkout-object';
import { CheckoutObjectDataMapperImpl } from './checkout-object-data-mapper-impl';

interface ICheckoutObjectDataMapper extends IDataMapper<CheckoutObject> {
  returnItem(returnTime: EpochNumber, uid: number): Promise<IDbResult<void>>;
}

export { CheckoutObject, CheckoutObjectDataMapperImpl, ICheckoutObjectDataMapper };
