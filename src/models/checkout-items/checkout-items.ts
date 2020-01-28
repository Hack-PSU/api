/* eslint-disable class-methods-use-this */
import jsonAssetLoader from '../../assets/schemas/json-asset-loader';
import BaseObject from '../BaseObject';

const checkoutItemsSchema = jsonAssetLoader('checkoutItemSchema');

export const TABLE_NAME = 'CHECKOUT_ITEMS';

/**
 * TODO: Add documentation
 */
export interface ICheckoutItemsApiModel {
  uid?: number;
  name: string;
  quantity: number;
}

export class CheckoutItems extends BaseObject {

  public get schema() {
    return checkoutItemsSchema;
  }
  public get id() {
    return this.uid;
  }

  public uid?: number;
  public name: string;
  public quantity: number;

  constructor(data: ICheckoutItemsApiModel) {
    super();
    this.uid = data.uid;
    this.name = data.name;
    this.quantity = data.quantity;
  }
}
