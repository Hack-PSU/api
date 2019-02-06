import { CheckoutObject } from './checkout-object';
import { CheckoutObjectDataMapperImpl } from './checkout-object-data-mapper-impl'
import { IDataMapper, IDbResult } from '../../services/database'

interface ICheckoutObjectDataMapper extends IDataMapper<CheckoutObject>{
    returnItem(object: CheckoutObject): Promise<IDbResult<CheckoutObject>>;
}

export { CheckoutObject, CheckoutObjectDataMapperImpl, ICheckoutObjectDataMapper };
