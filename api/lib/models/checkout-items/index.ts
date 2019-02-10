import { IDataMapper, IDbResult } from '../../services/database';
import { CheckoutItems } from './checkout-items';
import { CheckoutItemsDataMapperImpl } from './checkout-items-data-mapper-impl';

interface ICheckoutItemsDataMapper extends IDataMapper<CheckoutItems> {
  getAllAvailable(): Promise<IDbResult<CheckoutItems>>;
  getAvailable(): Promise<IDbResult<CheckoutItems>>;
}

export { CheckoutItems, CheckoutItemsDataMapperImpl };
