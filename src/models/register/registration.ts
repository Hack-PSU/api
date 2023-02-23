import jsonAssetLoader from '../../assets/schemas/json-asset-loader';
import { UidType } from '../../JSCommon/common-types';
import BaseObject from '../BaseObject';

const registeredUserSchema = jsonAssetLoader('registeredUserSchema');

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  NONBINARY = 'non-binary',
  NODISCLOSE = 'no-disclose',
}

export enum ShirtSize {
  XSMALL = 'XS',
  SMALL = 'S',
  MEDIUM = 'M',
  LARGE = 'L',
  XLARGE = 'XL',
  XXLARGE = 'XXL',
}

export enum AcademicYear {
  FRESHMAN = 'freshman',
  SOPHOMORE = 'sophomore',
  JUNIOR = 'junior',
  SENIOR = 'senior',
  GRADUATE = 'graduate',
  OTHER = 'other',
}

export enum CodingExperience {
  NONE = 'none',
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  GOD = 'god',
}

export enum VeteranOptions {
  YES = 'true',
  NO = 'false',
  NODISCLOSE = 'no-disclose',
}

export enum EducationalInstitutionType {
  LESS_THAN_SECONDARY = 'less-than-secondary',
  SECONDARY = 'secondary',
  TWO_YEAR_UNIVERSITY = 'two-year-university',
  THREE_PLUS_YEAR_UNIVERSITY = 'three-plus-year-university',
  GRADUATE_UNIVERSITY = 'graduate-university',
  CODE_SCHOOL_BOOTCAMP = 'code-school-or-bootcamp',
  VOCATIONAL_TRADE_APPRENTICESHIP = 'vocational-trade-apprenticeship',
  OTHER = 'other',
  NOT_A_STUDENT = 'not-a-student',
  PREFER_NO_ANSWER = 'prefer-no-answer',
}

export interface IRegistrationApiModel {
  time: number;
  firstName: string;
  lastName: string;
  gender: Gender;
  shirtSize: ShirtSize;
  dietaryRestriction: string | null;
  allergies: string | null;
  travelReimbursement: boolean;
  driving: boolean;
  firstHackathon: boolean;
  university: string;
  email: string;
  academicYear: AcademicYear;
  educationalInstitutionType: EducationalInstitutionType;
  major: string;
  phone: string;
  country: string;
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
  veteran: VeteranOptions;
  submitted: boolean;
  shareAddressMlh: boolean | null;
  shareAddressSponsors: boolean | null;
  shareEmailMlh: boolean | null;
  wordPin: string;
}

export class Registration extends BaseObject {

  public get schema() {
    return registeredUserSchema;
  }

  public firstname: string;
  public lastname: string;
  public gender: string;
  public shirt_size: string;
  public dietary_restriction: string | null;
  public allergies: string | null;
  public travel_reimbursement: boolean;
  public driving: boolean;
  public first_hackathon: boolean;
  public university: string;
  public email: string;
  public academic_year: string;
  public educational_institution_type: string;
  public major: string;
  public phone: string;
  public country: string;
  public race: string | null;
  public resume: string | null;
  public coding_experience: string | null;
  public uid?: string;
  public eighteenBeforeEvent: boolean;
  public mlh_coc: boolean;
  public mlh_dcp: boolean;
  public referral: string | null;
  public project: string | null;
  public expectations: string | null;
  public veteran: string;
  public time: number;
  public hackathon: string;
  public submitted: boolean;
  public pin: number;
  public share_address_mlh: boolean;
  public share_address_sponsors: boolean;
  public share_email_mlh: boolean;
  public word_pin: string;

  constructor(data: IRegistrationApiModel) {
    super();
    this.firstname = data.firstName;
    this.lastname = data.lastName;
    this.gender = data.gender;
    this.shirt_size = data.shirtSize;
    this.dietary_restriction = data.dietaryRestriction || null;
    this.allergies = data.allergies || null;
    this.travel_reimbursement = data.travelReimbursement;
    this.driving = data.driving;
    this.first_hackathon = data.firstHackathon;
    this.university = data.university;
    this.email = data.email;
    this.academic_year = data.academicYear;
    this.educational_institution_type = data.educationalInstitutionType;
    this.major = data.major;
    this.phone = data.phone;
    this.country = data.country;
    this.race = data.ethnicity;
    this.resume = data.resume;
    this.coding_experience = data.codingExperience;
    this.uid = data.uid;
    this.eighteenBeforeEvent = data.eighteenBeforeEvent;
    this.mlh_coc = data.mlhcoc;
    this.mlh_dcp = data.mlhdcp;
    this.referral = data.referral;
    this.project = data.projectDesc;
    this.expectations = data.expectations;
    this.veteran = data.veteran;
    this.time = data.time;
    this.submitted = data.submitted;
    this.share_address_mlh = data.shareAddressMlh || false;
    this.share_address_sponsors = data.shareAddressSponsors || false;
    this.share_email_mlh = data.shareEmailMlh || false;
    this.word_pin = data.wordPin || "";
    // this.hackathon = data.hackathon;
  }

  public get id() {
    return this.uid;
  }
}

export interface IRegistrationStats {
  academic_year: AcademicYear;
  coding_experience: CodingExperience;
  dietary_restriction: string | null;
  travel_reimbursement: boolean;
  race: string | null;
  shirt_size: ShirtSize;
  gender: Gender;
  first_hackathon: boolean;
  veteran: VeteranOptions;
}
