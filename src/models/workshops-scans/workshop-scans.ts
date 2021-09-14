/* eslint-disable class-methods-use-this */
import { EpochNumber, UidType } from '../../JSCommon/common-types';
import BaseObject from '../BaseObject';

export const TABLE_NAME = 'WORKSHOP_SCANS';

/**
 * TODO: Add documentation
 */
export class WorkshopScan extends BaseObject {
  
  public event_id: UidType;
  public hackathon_id: UidType;
  public scan_uid: number;
  public timestamp: EpochNumber;
  public user_pin: number;
  time: any;

  public get schema() {
    return null;
  }
  public get id() {
    return this.scan_uid;
  }
  constructor(data) {
    super();
  }
}