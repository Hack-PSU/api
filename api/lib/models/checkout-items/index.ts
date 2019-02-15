import { Stream } from 'ts-stream';
import { IDataMapper, IDbResult } from '../../services/database';
import { CheckoutItems } from './checkout-items';

export interface ICheckoutItemsDataMapper extends IDataMapper<CheckoutItems> {
    /**
     * Returns all available items
     */
  getAllAvailable(): Promise<IDbResult<Stream<CheckoutItems>>>;

    /**
     * Returns the availability of a specific item
     * @param {number} id ID of the item to return availability for
     */
  getAvailable(id: number): Promise<IDbResult<CheckoutItems>>;
}
