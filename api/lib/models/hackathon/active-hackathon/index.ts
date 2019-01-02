import { Observable } from 'rxjs';
import { Stream } from 'ts-stream';
import { UidType } from '../../../JSCommon/common-types';
import { IDbResult } from '../../../services/database';
import { IHackathonDataMapper } from '../index';
import { ActiveHackathon } from './active-hackathon';
import { ActiveHackathonDataMapperImpl } from './active-hackathon-data-mapper-impl';

interface IActiveHackathonDataMapper extends IHackathonDataMapper {
  readonly activeHackathon: Observable<ActiveHackathon>;

  get(id: UidType): Promise<IDbResult<ActiveHackathon>>;

  makeActive(id: UidType): Promise<IDbResult<ActiveHackathon>>;

  getAll(): Promise<IDbResult<Stream<ActiveHackathon>>>;

  getCount(): Promise<IDbResult<number>>;
}
export { IActiveHackathonDataMapper, ActiveHackathonDataMapperImpl };
