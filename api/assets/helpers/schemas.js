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
        additionalProperties: { type: 'string' },
      },
    },
    required: ['email'],
  },
  preRegisteredSchema: {
    type: 'object',
    properties: {
      uid: {
        type: 'string',
      },
      email: {
        type: 'string',
        format: 'email',
      },
    },
    required: ['uid', 'email'],
  },
  rsvpSchema: {
    type: 'object',
    properties: {
      user_uid: {
        type: 'string',
      },
      rsvp_time: {
        type: 'number',
      },
      rsvp_status: {
        type: 'boolean',
      },
    },
    required: ['user_uid', 'rsvp_time', 'rsvp_status'],
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
        enum: ['male', 'female', 'non-binary', 'no-disclose'],
      },
      shirtSize: {
        enum:
          ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      },
      dietaryRestriction: {
        type: 'string',
        minLength:
          1,
        maxLength:
          45,
      },
      allergies: {
        type: 'string',
      },
      travelReimbursement: {
        type: 'boolean',
      },
      firstHackathon: {
        type: 'boolean',
      },
      university: {
        type: 'string',
        minLength:
          1,
        maxLength:
          200,
      },
      email: {
        type: 'string',
        format: 'email',
      },
      academicYear: {
        enum:
          ['freshman', 'sophomore', 'junior', 'senior', 'graduate', 'other'],
      },
      major: {
        type: 'string',
        minLength:
          1,
        maxLength:
          100,
      },
      phone: {
        type: 'string',
        minLength:
          1,
        maxLength:
          50,
      },
      ethnicity: {
        type: 'string',
        maxLength:
          150,
      },
      codingExperience: {
        enum:
          ['none', 'beginner', 'intermediate', 'advanced', 'null'],
      },
      uid: {
        type: 'string',
        maxLength:
          150,
      },
      veteran: {
        enum:
          ['true', 'false', 'no-disclose'],
      },
      eighteenBeforeEvent: {
        type: 'boolean',
      },
      mlhcoc: {
        type: 'boolean',
      },
      mlhdcp: {
        type: 'boolean',
      },
      referral: {
        type: 'string',
      },
      projectDesc: {
        type: 'string',
      },
      expectations: {
        type: 'string',
      },
      time: {
        type: 'number',
      },
    },
    required: ['firstName', 'lastName', 'gender', 'shirtSize', 'travelReimbursement', 'firstHackathon', 'email', 'academicYear', 'major', 'uid', 'eighteenBeforeEvent', 'mlhcoc', 'mlhdcp'],
  },
  rfidAssignmentSchema: {
    type: 'array',
    minItems:
      1,
    items:
      {
        type: 'object',
        properties:
          {
            rfid: {
              type: 'string',
            },
            uid: {
              type: 'string',
            },
            time: {
              type: 'number',
            }
            ,
          },
        required: ['rfid_uid', 'user_uid', 'time'],
      }
    ,
  },
  rfidScansSchema: {
    type: 'array',
    minItems:
      1,
    items: {
      type: 'object',
      properties: {
        rfid_uid: {
          type: 'string',
        },
        scan_location: {
          type: 'string',
        },
        scan_time: {
          type: 'number',
        },
      },
      required: ['rfid_uid', 'scan_location', 'scan_time'],
    }
    ,
  },
  travelReimbursementSchema: {
    type: 'object',
    properties: {
      fullName: {
        type: 'string',
        minLength:
          1,
        maxLength:
          100,
      },
      reimbursementAmount: {
        type: 'number',
      },
      mailingAddress: {
        type: 'string',
      },
      groupMembers: {
        enum:
          ['1', '2', '3', '4+'],
      },
      required: ['fullName', 'reimbursementAmount', 'mailingAddress', 'groupMembers'],
    }
    ,
  },
  projectRegistrationSchema: {
    type: 'object',
    properties: {
      projectName: {
        type: 'string',
      },
      team: {
        type: 'array',
        items: {
          type: 'string',
          format:
            'email',
        },
        uniqueItems: true,
        minItems:
          1,
        maxItems:
          5,
      },
      categories: {
        type: 'array',
        uniqueItems: true, // validation handled at runtime
      },
    },
    required: ['projectName', 'team', 'categories'],
  },
  eventSchema: {},
};
