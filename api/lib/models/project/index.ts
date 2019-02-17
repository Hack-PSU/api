import { UidType } from '../../JSCommon/common-types';
import * as squel from 'squel';
import { IDataMapper, IDbResult } from '../../services/database';
import { IUowOpts } from '../../services/database/svc/uow.service';
import { Project } from './project';
import { ProjectDataMapperImpl } from './project-data-mapper-impl';

interface IProjectDataMapper extends  IDataMapper<Project> {

  assignTable(object: Project): Promise<IDbResult<any>>;

}

export {
  Project,
  IProjectDataMapper,
  ProjectDataMapperImpl,
};
