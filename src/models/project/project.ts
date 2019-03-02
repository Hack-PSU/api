import jsonAssetLoader from '../../assets/schemas/json-asset-loader';
import { UidType } from '../../JSCommon/common-types';
import BaseObject from '../BaseObject';

const projectSchema = jsonAssetLoader('projectRegistrationSchema');

export interface IProjectApiModel {
  project_name: string;
  team: string[];
  categories: string[];
  projectId: UidType;

}

export class Project extends BaseObject {

  public readonly project_name: string;
  public readonly team: string[];
  public readonly categories: string[];
  public projectId: UidType;

  public get id() {
    return this.projectId;
  }

  public get schema(): any {
    return projectSchema;
  }

  constructor(data: IProjectApiModel) {
    super();
    this.project_name = data.projectId;
    this.team = data.team;
    this.categories = data.categories;
    this.projectId = data.projectId;
  }

}
