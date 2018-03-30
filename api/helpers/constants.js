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
    required: ['email'],
  },
  emailKey: {
    key: process.env.ACCESS_KEY_ID,
    secret: process.env.SECRET_ACCESS_KEY
  },
  rediskey: process.env.REDIS_API_KEY || 'rediskey',
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
  RSVPEmailHtml: {
      fromEmail: "team@hackpsu.org",
      subject: "HackPSU RSVP Confirmation",
      text: "Hi $name$<br><br><br>your pin is: $pin$<br><br>HackPSU team" // TODO: Change
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
      projectDesc: {
        type: 'string'
      },
      expectations: {
        type: 'string'
      }
    },
    required: ['firstName', 'lastName', 'gender', 'shirtSize', 'travelReimbursement', 'firstHackathon', 'email', 'academicYear', 'major', 'uid', 'eighteenBeforeEvent', 'mlhcoc', 'mlhdcp']
  },
  rfidAssignmentSchema: {
    type: 'array',
    minItems: 1,
    items:
      {
        type: "object",
        properties: {
          rfid: {
            type: "string",
          },
          uid: {
            type: "string",
          },
          time: {
            type: 'number',
          }
        },
        required: ['rfid_uid', 'user_uid', 'time'],
      }
  },
  rfidScansSchema: {
    type: 'array',
    minItems: 1,
    items:
      {
        type: "object",
        properties: {
          rfid_uid: {
            type: "string",
          },
          scan_location: {
            type: "string",
          },
          scan_time: {
            type: 'number',
          }
        },
        required: ['rfid_uid', 'scan_location', 'scan_time'],
      }
  },
    s3Connection: {
        s3BucketName: 'hackpsus2018-resumes',
        s3TravelReimbursementBucket: 'hackpsus2018-travel-reimbursement-receipts',
        secretAccessKey: process.env.SECRET_ACCESS_KEY,
        accessKeyId: process.env.ACCESS_KEY_ID,
        region: 'us-east-2',
    },
    travelReimbursementSchema: {
        type: 'object',
        properties: {
            fullName: {
                type: 'string',
                minLength: 1,
                maxLength: 100
            },
            reimbursementAmount: {
                type: 'number'
            },
            mailingAddress: {
                type: 'string'
            },
            groupMembers: {
                "enum": ["1", "2", "3", "4+"]
            },
        },
        required: ['fullName','reimbursementAmount','mailingAddress', 'groupMembers']
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
