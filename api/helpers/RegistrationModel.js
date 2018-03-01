module.exports = class RegistrationModel {
    constructor(data) {
        this.firstname = data.firstName ? data.firstName : null;
        this.lastname = data.lastName ? data.lastName : null;
        this.gender = data.gender ? data.gender : null;
        this.shirt_size = data.shirtSize ? data.shirtSize : null;
        this.dietary_restriction = data.dietaryRestriction ? data.dietaryRestriction : null;
        this.allergies = data.allergies ? data.allergies : null;
        this.travel_reimbursement = data.travelReimbursement;
        this.first_hackathon = data.firstHackathon;
        this.university = data.university ? data.university : null;
        this.email = data.email ? data.email : null;
        this.academic_year = data.academicYear ? data.academicYear : null;
        this.major = data.major ? data.major : null;
        this.phone = data.phone ? data.phone : null;
        this.race = data.ethnicity ? data.ethnicity : null;
        this.resume = data.resume ? data.resume : null;
        this.coding_experience = data.codingExperience ? data.codingExperience : null;
        this.uid = data.uid ? data.uid : null;
        this.eighteenBeforeEvent = data.eighteenBeforeEvent;
        this.mlh_coc = data.mlhcoc;
        this.mlh_dcp = data.mlhdcp;
        this.referral = data.referral ? data.referral : null;
        this.project = data.projectDesc ? data.projectDesc : null;
        this.expectations = data.expectations ? data.expectations : null;
        this.veteran = data.veteran ? data.veteran : 'no-disclose';
    }
};