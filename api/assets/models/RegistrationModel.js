module.exports = class RegistrationModel {
  constructor(data) {
    this.firstname = data.firstName || null;
    this.lastname = data.lastName || null;
    this.gender = data.gender || null;
    this.shirt_size = data.shirtSize || null;
    this.dietary_restriction = data.dietaryRestriction || null;
    this.allergies = data.allergies || null;
    this.travel_reimbursement = data.travelReimbursement || false;
    this.first_hackathon = data.firstHackathon || false;
    this.university = data.university || null;
    this.email = data.email || null;
    this.academic_year = data.academicYear || null;
    this.major = data.major || null;
    this.phone = data.phone || '0000000000';
    this.race = data.ethnicity || null;
    this.resume = data.resume || null;
    this.coding_experience = data.codingExperience || null;
    this.uid = data.uid || null;
    this.eighteenBeforeEvent = data.eighteenBeforeEvent || false;
    this.mlh_coc = data.mlhcoc || false;
    this.mlh_dcp = data.mlhdcp || false;
    this.referral = data.referral || null;
    this.project = data.projectDesc || null;
    this.expectations = data.expectations || null;
    this.veteran = data.veteran || 'no-disclose';
  }
};
