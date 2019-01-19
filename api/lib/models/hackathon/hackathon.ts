import * as uuid from 'uuid';
import loadSchemas from '../../assets/schemas/load-schemas';
import { EpochNumber, UidType } from '../../JSCommon/common-types';
import BaseObject from '../BaseObject';
import { IHackathonApiModel } from './index';

const hackathonSchema = loadSchemas('hackathonSchema');

export class Hackathon extends BaseObject {
  public get id() {
    return this.uid;
  }

  protected get schema(): any {
    return hackathonSchema;
  }

  public readonly uid: UidType;
  public readonly name: string;
  public readonly start_time: EpochNumber;
  public readonly end_time: EpochNumber | null;
  public readonly base_pin: number | null;
  public active: boolean;

  constructor(data: IHackathonApiModel) {
    super();
    this.uid = data.uid || uuid.v4().replace(/-/g, '');
    this.name = data.name;
    this.start_time = data.startTime || Date.now();
    this.end_time = data.endTime;
    this.base_pin = data.basePin;
    this.active = false;
  }
}
