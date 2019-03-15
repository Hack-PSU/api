/* eslint-disable class-methods-use-this */
import { CheckoutObject } from './checkout-object';

export const TABLE_NAME = 'CHECKOUT_DATA';

export class CheckoutObjectWithUser extends CheckoutObject {

  public get schema() {
    return super.schema;
  }
  public get id() {
    return super.id;
  }

  public firstname?: string;
  public lastname?: string;
  public name?: string;
}
