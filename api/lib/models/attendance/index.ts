import { Stream } from 'ts-stream';
import { IDataMapper, IDbResult } from '../../services/database';
import { Attendance } from '../Attendance';


interface IAttendanceDataMapper extends IDataMapper {

  getAll(): Promise<IDbResult<Stream<Attendance>>>;

  getCount(): Promise<IDbResult<number>>;
}

export { IAttendanceDataMapper, Attendance };

