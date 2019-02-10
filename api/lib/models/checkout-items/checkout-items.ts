/* eslint-disable class-methods-use-this */
import BaseObject from '../BaseObject';
import jsonAssetLoader from '../../assets/schemas/json-asset-loader'

const checkoutItemsSchema = jsonAssetLoader('checkoutItemSchema');

export const TABLE_NAME = 'CHECKOUT_ITEMS';

/**
 * TODO: Add documentation
 */
interface ICheckoutItemsApiModel {
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

  public readonly uid: number;
  public name: string;
  public quantity: number
  
  constructor(data: ICheckoutItemsApiModel) {
    super();
    this.name = data.name;
    this.quantity = data.quantity;
    
  }
}