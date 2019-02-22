import { UidType } from '../../JSCommon/common-types';
import { IDataMapper, IDbResult } from '../../services/database';
import { Project } from './project';
import { ProjectDataMapperImpl } from './project-data-mapper-impl';

interface IProjectDataMapper extends  IDataMapper<Project> {

  assignTable(object: Project): Promise<IDbResult<number>>;
  insert(object: Project): Promise<IDbResult<Project>>;
  // getByUser(uid: UidType): Promise<IDbResult<Project>>;
}

export {
  Project,
  IProjectDataMapper,
  ProjectDataMapperImpl,
};
