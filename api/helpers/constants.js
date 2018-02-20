module.exports = {
    emailObjectSchema: {
        type: 'object',
        properties: {
            email: {
                type: 'string',
                format: 'email',
            },
            name: {
                type: 'string',
                minLength: 1,
            },
            substitutions: {
                type: 'object',
                additionalProperties: {type: 'string'},
            },
        },
        required: ['email', 'name'],
    },
    emailServerUrl: 'https://api.sendinblue.com/v3/smtp/email',
    sqlConnection: {
        host     : process.env.RDS_HOSTNAME || 'localhost',
        user     : process.env.RDS_USERNAME || 'user',
        password : process.env.RDS_PASSWORD || 'secret',
        database : process.env.RDS_DATABASE || 'my_db',
    },
    registeredUserSchema: {
        type:'object',
        properties: {
            firstName: {
                type: 'string',
                minLength: 1,
                maxLength: 45,
            },
            lastName: {
                type: 'string',
                minLength: 1,
                maxLength: 45,
            },
            gender: { 
                "enum":  ['male','female','non-ninary','no-disclose']
            },
            shirtSize:{ 
                "enum": ['XS','S','M','L','XL','XXL']
            },
            dietaryRestriction: {
                "enum": ['vegetarian','vegan','kosher','allergies', 'halal']  
            },
            allergies: {
                type: 'string',
                minLength: 1,
                maxLength: 45,
            },
            travelReimbursement: {
                type: 'boolean'
            }, 
            firstHackathon: {
                type: 'boolean'
            },
            university: {
                type: 'string',
                minLength: 1, 
                maxLength: 200,
            },
            email: {
                type: 'string',
                format: 'email'   
            },
            academicYear: {
                "enum": ["freshman", "sophomore", "junior", "senior", "higher"]
            },
            major: {
                type: 'string',
                minLength: 1,
                maxLength: 100
            },
            phone: {
                type: 'string', 
                minLength: 1,
                maxLength: 50
            },
            race: {
                type: 'string',
                maxLength: 150
            },
            codingExperience: {
                "enum": ["none","beginner", "intermediate", "advanced", 'null']
            },
            uid: {
                type: 'string',
                maxLength: 150
            },
            eighteenBeforeEvent: {
                type: 'boolean'
            }, 
            mlhCOC: {
                type: 'boolean' 
            },
            mlhDCP: {
                type: 'boolean'
            },
            referral: {
                type: 'string'
            },
            project: { 
                type: 'string'
            },
            return: {
                type: 'string'
            }


            },
            required: ['firstName', 'lastName', 'gender', 'shirtSize', 'travelReimbursement', 'firstHackathon', 'email', 'academicYear', 'major', 'phone', 'uid', 'eighteenBeforeEvent', 'mlhcoc', 'mlhdcp']

        }
    };

//     First name
// Last name
// Gender
// - Male
// - Female
// - Non-Binary
// - Prefer not to disclose
// Will you be 18 before the date (ILLEGAL TO SAY NO, CANCEL REGISTRATION)
// Shirt size
// - XS, S, M, L, XL, XXL
// Dietary restriction
// - Vegetarian
// - Vegan
// - Kosher
// - Allergies
// -- Jump to describe
// Will you need travel reimbursement?
// Is this your first hackathon?
// Name of University
// - Type in on other
// School email
// Academic Year
// (Intended) Major
// Resume
// Agree to MLH COC?

// -----------------------------------------------
// *Demographics*
// Race/Ethnicities?
// Languages spoken?
// Sexual orientation?
// Coding experience?
// __________________________________________________________
// *New questions*
// Where did you hear about hackPSU?
// What is a project you're proud of?


