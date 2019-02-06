import { CheckoutItems } from './checkout-items';
import { CheckoutItemsDataMapperImpl } from './checkout-items-data-mapper-impl'
import { IDataMapper, IDbResult } from '../../services/database'
import { Stream } from "ts-stream";

/** 
 * getAllAvailable: Returns all available items
 * getAvailable: Returns the availability of a specific item
*/

interface ICheckoutItemsDataMapper extends IDataMapper<CheckoutItems>{
    getAllAvailable(): Promise<IDbResult<Stream<CheckoutItems>>>;
    getAvailable(id: number): Promise<IDbResult<CheckoutItems>>;
}

export { CheckoutItems, CheckoutItemsDataMapperImpl, ICheckoutItemsDataMapper };
