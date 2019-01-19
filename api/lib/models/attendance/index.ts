import { Stream } from 'ts-stream';
import { IDataMapper, IDbResult } from '../../services/database';
import { Attendance } from './attendance';
import { AttendanceDataMapperImpl } from './attendance-data-mapper-impl'
import { IUowOpts } from '../../services/database/svc/uow.service';

interface IAttendanceDataMapper extends IDataMapper {

  getAll(opts?: IUowOpts): Promise<IDbResult<Stream<Attendance>>>;

  getCount(opts?: IUowOpts): Promise<IDbResult<number>>;
}

export { IAttendanceDataMapper, Attendance, AttendanceDataMapperImpl };

