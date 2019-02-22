import jsonAssetLoader from '../../assets/schemas/json-asset-loader';
import BaseObject from '../BaseObject';
import {UidType} from '../../JSCommon/common-types';

const projectSchema = jsonAssetLoader('projectRegistrationSchema');

export interface IProjectModel {
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

  constructor(data: IProjectModel) {
    super();
    this.project_name = data.projectId;
    this.team = data.team;
    this.categories = data.categories;
    this.projectId = data.projectId;
  }

}
