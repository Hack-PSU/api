import { EpochNumber, UidType } from '../../../JSCommon/common-types';
import { IDataMapper, IDbResult } from '../../../services/database';
import { IUowOpts } from '../../../services/database/svc/uow.service';
import { AcademicYear, CodingExperience, Gender, ShirtSize, VeteranOptions } from '../../register';

interface IUserCount {
  pre_count: number;
  reg_count: number;
  rsvp_count: number;
  checkin_count: number;
}

interface IUserStatistics {
  // Pre-Registration data
  pre_uid: UidType;
  pin: number;
  // Registration data
  firstName: string;
  lastName: string;
  gender: Gender;
  shirtSize: ShirtSize;
  dietaryRestriction: string | null;
  allergies: string | null;
  travelReimbursement: boolean;
  firstHackathon: boolean;
  university: string;
  email: string;
  academicYear: AcademicYear;
  major: string;
  phone: string;
  ethnicity: string | null;
  resume: string | null;
  codingExperience: CodingExperience | null;
  uid?: UidType;
  eighteenBeforeEvent: boolean;
  mlhcoc: boolean;
  mlhdcp: boolean;
  referral: string | null;
  projectDesc: string | null;
  expectations: string | null;
  veteran: VeteranOptions | null;
  // Hackathon data
  name: string;
  start_time: EpochNumber;
  end_time: EpochNumber;
  base_pin: number;
  active: boolean;
  // RSVP data
  user_id: UidType;
  rsvp_time: EpochNumber;
  rsvp_status: boolean;
  // Wristband  data
  user_uid: UidType;
}

interface IAdminStatisticsDataMapper extends IDataMapper<any> {

  getUserCount(uowOpts?: IUowOpts): Promise<IDbResult<IUserCount>>;

  getAllUserData(opts?: IUowOpts): Promise<IDbResult<IUserStatistics>>;
}

export { IAdminStatisticsDataMapper, IUserCount, IUserStatistics };
