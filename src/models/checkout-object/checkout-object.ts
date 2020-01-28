/* eslint-disable class-methods-use-this */
import jsonAssetLoader from '../../assets/schemas/json-asset-loader';
import { EpochNumber, UidType } from '../../JSCommon/common-types';
import BaseObject from '../BaseObject';

const checkoutObjectSchema = jsonAssetLoader('checkoutObjectSchema');

export const TABLE_NAME = 'CHECKOUT_DATA';

/**
 * itemId: The ID of the item being checked out.
 * userId: The ID of the user checking out the item.
 * checkoutTime: The time the item was checked out.
 * returnTime: The time the item was returned.
 * hackathon: The hackathon that this checkout belongs to.
 */
export interface ICheckoutObjectApiModel {
  uid?: number;
  itemId: number;
  userId: string;
  checkoutTime: EpochNumber;
  returnTime?: EpochNumber;
  hackathon?: UidType;
}

export class CheckoutObject extends BaseObject {
  public get schema() {
    return checkoutObjectSchema;
  }
  public get id() {
    return this.uid;
  }
  public uid?: number;
  public item_id: number;
  public user_id: string;
  public checkout_time: EpochNumber;
  public return_time?: EpochNumber;
  public hackathon?: UidType;

  constructor(data: ICheckoutObjectApiModel) {
    super();
    this.uid = data.uid;
    this.item_id = data.itemId;
    this.user_id = data.userId;
    this.checkout_time = data.checkoutTime || Date.now();
    this.return_time = data.returnTime;
    this.hackathon = data.hackathon;
  }
}
