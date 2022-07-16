import jsonAssetLoader from '../../assets/schemas/json-asset-loader';
import { UidType } from '../../JSCommon/common-types';
import BaseObject from '../BaseObject';

const projectSchema = jsonAssetLoader('projectRegistrationSchema');

export interface IProjectApiModel {
  project: string;
  uid?: number;
  hackathon?: UidType;
}

export class Project extends BaseObject {

  public readonly project: string;
  public readonly hackathon?: UidType;
  public readonly uid?: number;

  public get id() {
    return this.uid;
  }

  public get schema(): any {
    return projectSchema;
  }

  constructor(data: IProjectApiModel) {
    super();
    this.project = data.project;
    this.hackathon = data.hackathon;
    this.uid = data.uid;
  }

}
