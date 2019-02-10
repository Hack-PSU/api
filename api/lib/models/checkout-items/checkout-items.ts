/* eslint-disable class-methods-use-this */
import BaseObject from '../BaseObject';

export const TABLE_NAME = 'CHECKOUT_ITEMS';

/**
 * TODO: Add documentation
 */
interface ICheckoutItemsApiModel {
  name: string;
  quantity: number;
}

export class CheckoutItems extends BaseObject {

  public name: string;
  public quantity: number;

  public get schema() {
    return null;
  }
  public get id() {
    return null;
  }
  constructor(data: ICheckoutItemsApiModel) {
    super();
    this.name = data.name;
    this.quantity = data.quantity;
  }
}
