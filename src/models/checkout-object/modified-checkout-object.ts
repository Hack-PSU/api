/* eslint-disable class-methods-use-this */
import { EpochNumber, UidType } from '../../JSCommon/common-types';
import { CheckoutObject } from './checkout-object';

export const TABLE_NAME = 'CHECKOUT_DATA';

/**
 * item_id: The ID of the item being checked out.
 * user_id: The ID of the user checking out the item.
 * checkout_time: The time the item was checked out.
 * return_time: The time the item was returned.
 * hackathon: The hackathon that this checkout belongs to.
 * firstname: First name of user linked to the user_id
 * lastname: Last name of the user linked to the user_id
 * 
 */
interface IModifiedCheckoutObjectApiModel {
  item_id: number;
  user_id: string;
  checkout_time: EpochNumber;
  return_time?: EpochNumber;
  hackathon?: UidType;
  firstname?: string;
  lastname?: string;
  name?: string;
}

export class ModifiedCheckoutObject extends CheckoutObject {

  public get schema() {
    return super.schema;
  }
  public get id() {
    return super.id;
  }

  public firstname?: string;
  public lastname?: string;
  public name?: string;

  constructor(data: IModifiedCheckoutObjectApiModel) {
    super(data);
    this.firstname = data.firstname;
    this.lastname = data.lastname;
    this.name = data.name;
  }
}
