"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const json_asset_loader_1 = __importDefault(require("../../assets/schemas/json-asset-loader"));
const BaseObject_1 = __importDefault(require("../BaseObject"));
const registeredUserSchema = json_asset_loader_1.default('registeredUserSchema');
var Gender;
(function (Gender) {
    Gender["MALE"] = "male";
    Gender["FEMALE"] = "female";
    Gender["NONBINARY"] = "non-binary";
    Gender["NODISCLOSE"] = "no-disclose";
})(Gender = exports.Gender || (exports.Gender = {}));
var ShirtSize;
(function (ShirtSize) {
    ShirtSize["XSMALL"] = "XS";
    ShirtSize["SMALL"] = "S";
    ShirtSize["MEDIUM"] = "M";
    ShirtSize["LARGE"] = "L";
    ShirtSize["XLARGE"] = "XL";
    ShirtSize["XXLARGE"] = "XXL";
})(ShirtSize = exports.ShirtSize || (exports.ShirtSize = {}));
var AcademicYear;
(function (AcademicYear) {
    AcademicYear["FRESHMAN"] = "freshman";
    AcademicYear["SOPHOMORE"] = "sophomore";
    AcademicYear["JUNIOR"] = "junior";
    AcademicYear["SENIOR"] = "senior";
    AcademicYear["GRADUATE"] = "graduate";
    AcademicYear["OTHER"] = "other";
})(AcademicYear = exports.AcademicYear || (exports.AcademicYear = {}));
var CodingExperience;
(function (CodingExperience) {
    CodingExperience["NONE"] = "none";
    CodingExperience["BEGINNER"] = "beginner";
    CodingExperience["INTERMEDIATE"] = "intermediate";
    CodingExperience["ADVANCED"] = "advanced";
    CodingExperience["GOD"] = "god";
})(CodingExperience = exports.CodingExperience || (exports.CodingExperience = {}));
var VeteranOptions;
(function (VeteranOptions) {
    VeteranOptions["YES"] = "true";
    VeteranOptions["NO"] = "false";
    VeteranOptions["NODISCLOSE"] = "no-disclose";
})(VeteranOptions = exports.VeteranOptions || (exports.VeteranOptions = {}));
class Registration extends BaseObject_1.default {
    get schema() {
        return registeredUserSchema;
    }
    constructor(data) {
        super();
        this.firstname = data.firstName;
        this.lastname = data.lastName;
        this.gender = data.gender;
        this.shirt_size = data.shirtSize;
        this.dietary_restriction = data.dietaryRestriction || null;
        this.allergies = data.allergies || null;
        this.travel_reimbursement = data.travelReimbursement;
        this.first_hackathon = data.firstHackathon;
        this.university = data.university;
        this.email = data.email;
        this.academic_year = data.academicYear;
        this.major = data.major;
        this.phone = data.phone;
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
        // this.hackathon = data.hackathon;
    }
    get id() {
        return this.uid;
    }
}
exports.Registration = Registration;
//# sourceMappingURL=registration.js.map