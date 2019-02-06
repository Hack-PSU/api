/* eslint-disable class-methods-use-this */
import BaseObject from '../BaseObject';
import jsonAssetLoader from '../../assets/schemas/json-asset-loader'
import { EpochNumber, UidType } from '../../JSCommon/common-types';

const checkoutObjectSchema = jsonAssetLoader('checkoutObjectSchema');

export const TABLE_NAME = 'CHECKOUT_DATA';

/**
 * item_id: The ID of the item being checked out.
 * user_id: The ID of the user checking out the item.
 * checkout_time: The time the item was checked out.
 * return_time: The time the item was returned.
 * hackathon: The hackathon that this checkout belongs to.
 */

interface ICheckoutObjectApiModel {
  uid: number;
  item_id: number;
  user_id: string;
  checkout_time: EpochNumber;
  return_time: EpochNumber;
  hackathon: UidType;
}

export class CheckoutObject extends BaseObject {
  
  public get schema() {
    return checkoutObjectSchema;
  }
  public get id() {
    return this.uid;
  }
  public readonly uid: number;
  public item_id: number;
  public user_id: string;
  public checkout_time: EpochNumber;
  public return_time: EpochNumber;
  public hackathon: UidType;

  constructor(data: ICheckoutObjectApiModel) {
    super();
    this.uid;
    this.item_id = data.item_id;
    this.user_id = data.user_id;
    this.checkout_time = data.checkout_time;
    this.return_time = data.return_time;
    this.hackathon = data.hackathon;
  }
}