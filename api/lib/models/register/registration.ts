import { validate } from 'email-validator';
import assets from '../../assets/schemas/load-schemas';
import { EpochNumber, UidType } from '../../JSCommon/common-types';
import BaseObject from '../BaseObject';

const registeredUserSchema = assets('registeredUserSchema');

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

export interface IRegistrationApiModel {
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
  time: EpochNumber;
  hackathon: UidType;
}

export class Registration extends BaseObject {

  public get schema() {
    return registeredUserSchema;
  }

  public readonly firstname: string;
  public readonly lastname: string;
  public readonly gender: string;
  public readonly shirt_size: string;
  public readonly dietary_restriction: string | null;
  public readonly allergies: string | null;
  public readonly travel_reimbursement: boolean;
  public readonly first_hackathon: boolean;
  public readonly university: string;
  public readonly email: string;
  public readonly academic_year: string;
  public readonly major: string;
  public readonly phone: string;
  public readonly race: string | null;
  public readonly resume: string | null;
  public readonly coding_experience: string | null;
  public readonly uid?: string;
  public readonly eighteenBeforeEvent: boolean;
  public readonly mlh_coc: boolean;
  public readonly mlh_dcp: boolean;
  public readonly referral: string | null;
  public readonly project: string | null;
  public readonly expectations: string | null;
  public readonly veteran: string;
  public readonly time: number;
  public readonly hackathon: string;

  constructor(data: IRegistrationApiModel) {
    super();
    this.firstname = data.firstName;
    this.lastname = data.lastName;
    this.gender = data.gender;
    this.shirt_size = data.shirtSize;
    this.dietary_restriction = data.dietaryRestriction || null;
    this.allergies = data.allergies || null;
    this.travel_reimbursement = data.travelReimbursement || false;
    this.first_hackathon = data.firstHackathon || false;
    this.university = data.university;
    if (!data.email || !validate(data.email)) {
      throw new Error('Email format is invalid');
    }
    this.email = data.email;
    this.academic_year = data.academicYear;
    this.major = data.major;
    this.phone = data.phone;
    this.race = data.ethnicity;
    this.resume = data.resume;
    this.coding_experience = data.codingExperience;
    this.uid = data.uid;
    this.eighteenBeforeEvent = data.eighteenBeforeEvent || false;
    this.mlh_coc = data.mlhcoc || false;
    this.mlh_dcp = data.mlhdcp || false;
    this.referral = data.referral;
    this.project = data.projectDesc;
    this.expectations = data.expectations;
    this.veteran = data.veteran || 'no-disclose';
    this.time = Date.now();
    this.hackathon = data.hackathon;
  }

  public get id() {
    return this.uid;
  }
}
