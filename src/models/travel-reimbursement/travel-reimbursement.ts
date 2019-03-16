import v4 from 'uuid/v4';
import jsonAssetLoader from '../../assets/schemas/json-asset-loader';
import { UidType } from '../../JSCommon/common-types';
import BaseObject from '../BaseObject';

const rfidAssignmentSchema = jsonAssetLoader('travelReimbursementSchema');

interface ITravelReimbursementApiModel {
  receiptURIs: string;
  uid: UidType;
  groupMembers: '1' | '2' | '3' | '4+';
  mailingAddress: string;
  reimbursementAmount: number;
  fullName: string;
}

export class TravelReimbursement extends BaseObject {
  public get id() {
    return this.uid;
  }

  protected get schema(): any {
    return rfidAssignmentSchema;
  }

  public fullname: string;
  public reimbursement_amount: number;
  public mailing_address: string;
  public group_members: '1' | '2' | '3' | '4+';
  public user_id: UidType;
  public receipt_uris: string;
  public uid: UidType;

  constructor(data: ITravelReimbursementApiModel) {
    super();
    this.fullname = data.fullName;
    this.reimbursement_amount = data.reimbursementAmount || 0;
    this.mailing_address = data.mailingAddress;
    this.group_members = data.groupMembers;
    this.user_id = data.uid;
    this.receipt_uris = data.receiptURIs;
    this.uid = data.uid || v4().replace(/-/g, '');
  }

}
