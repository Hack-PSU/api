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

  public static merge(oldObject: Hackathon, newObject: Hackathon): Hackathon {
    newObject.uid = newObject.uid || oldObject.uid;
    newObject.name = newObject.name || oldObject.name;
    newObject.start_time = Math.abs(newObject.start_time - Date.now()) < 1000 ?
      parseInt(oldObject.start_time as any, 10) :
      newObject.start_time;
    newObject.end_time = newObject.end_time || parseInt(oldObject.end_time as any, 10);
    newObject.base_pin = newObject.base_pin || oldObject.base_pin;
    newObject.active = newObject.active || oldObject.active;
    return newObject;
  }

  public uid: UidType;
  public name: string;
  public start_time: EpochNumber;
  public end_time: EpochNumber | null;
  public base_pin: number | null;
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
