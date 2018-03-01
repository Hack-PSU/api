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
        host: process.env.RDS_HOSTNAME || 'localhost',
        user: process.env.RDS_USERNAME || 'user',
        password: process.env.RDS_PASSWORD || 'secret',
        database: process.env.RDS_DATABASE || 'my_db',
        // ssl: "Amazon RDS",
        typeCast: function castField(field, useDefaultTypeCasting) {

            // We only want to cast bit fields that have a single-bit in them. If the field
            // has more than one bit, then we cannot assume it is supposed to be a Boolean.
            if ((field.type === "BIT") && (field.length === 1)) {

                let bytes = field.buffer();

                // A Buffer in Node represents a collection of 8-bit unsigned integers.
                // Therefore, our single "bit field" comes back as the bits '0000 0001',
                // which is equivalent to the number 1.
                return (bytes[0] === 1);

            }

            return (useDefaultTypeCasting());

        }
    },
    registeredUserSchema: {
        type: 'object',
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
                "enum": ['male', 'female', 'non-binary', 'no-disclose']
            },
            shirtSize: {
                "enum": ['XS', 'S', 'M', 'L', 'XL', 'XXL']
            },
            dietaryRestriction: {
                type: "string",
                minLength: 1,
                maxLength: 45,
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
                "enum": ["freshman", "sophomore", "junior", "senior", "graduate", "other"]
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
            ethnicity: {
                type: 'string',
                maxLength: 150
            },
            codingExperience: {
                "enum": ["none", "beginner", "intermediate", "advanced", 'null']
            },
            uid: {
                type: 'string',
                maxLength: 150
            },
            veteran: {
                "enum": ["true", "false", "no-disclose"],
            },
            eighteenBeforeEvent: {
                type: 'boolean'
            },
            mlhcoc: {
                type: 'boolean'
            },
            mlhdcp: {
                type: 'boolean'
            },
            referral: {
                type: 'string'
            },
            project: {
                type: 'string'
            },
            expectations: {
                type: 'string'
            }
        },
        required: ['firstName', 'lastName', 'gender', 'shirtSize', 'travelReimbursement', 'firstHackathon', 'email', 'academicYear', 'major', 'uid', 'eighteenBeforeEvent', 'mlhcoc', 'mlhdcp']
    },
    s3Connection: {
        s3BucketName: 'hackpsus2018-resumes',
        secretAccessKey: process.env.SECRET_ACCESS_KEY,
        accessKeyId: process.env.ACCESS_KEY_ID,
        region: 'us-east-2',
    },
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


