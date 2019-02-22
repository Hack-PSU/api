import {UidType} from '../../JSCommon/common-types';
import {IDataMapper, IDbResult} from '../../services/database';
import {Project} from './project';
import {ProjectDataMapperImpl} from './project-data-mapper-impl';

interface IProjectDataMapper extends  IDataMapper<Project> {

  assignTable(object: Project): Promise<IDbResult<any>>;
  insert(object: Project): Promise<IDbResult<UidType>>;
  getByUser(uid: UidType): Promise<IDbResult<Project>>;
}

export {
  Project,
  IProjectDataMapper,
  ProjectDataMapperImpl,
};
