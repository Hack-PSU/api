import { UidType } from "JSCommon/common-types";
import BaseObject from "../../models/BaseObject";

export interface ISponsorApiModel {
  uid?: number;
  name: string;
  level: string;
  logo: string;
  hackathon: UidType;
}

export class Sponsor extends BaseObject {

  uid?: number;
  name: string;
  level: string;
  logo: string;
  hackathon: UidType;

  constructor(data: ISponsorApiModel) {
    super();
    this.uid = data.uid;
    this.name = data.name;
    this.level = data.level;
    this.logo = data.logo;
    this.hackathon = data.hackathon;
  }

  public get id(): any {
    return this.uid;
  }
  protected get schema(): any {
    return null;
  }
}