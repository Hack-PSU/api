module.exports = {
  // TODO: Possibly revamp this to use a single getter
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
      user_id: {
        type: 'string',
      },
      rsvp_time: {
        type: 'number',
      },
      rsvp_status: {
        type: 'boolean',
      },
    },
    required: ['user_id', 'rsvp_time', 'rsvp_status'],
  },
  registeredUserSchema: {
    type: 'object',
    properties: {
      firstname: {
        type: 'string',
        minLength: 1,
        maxLength: 45,
      },
      lastname: {
        type: 'string',
        minLength: 1,
        maxLength: 45,
      },
      gender: {
        enum: ['male', 'female', 'non-binary', 'no-disclose'],
      },
      shirt_size: {
        enum:
          ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      },
      dietary_restriction: {
        type: 'string',
        minLength:
          1,
        maxLength:
          45,
      },
      allergies: {
        type: 'string',
      },
      travel_reimbursement: {
        type: 'boolean',
      },
      first_hackathon: {
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
      academic_year: {
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
      coding_experience: {
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
      mlh_coc: {
        type: 'boolean',
      },
      mlh_dcp: {
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
    required: [
      'firstname',
      'lastname',
      'gender',
      'shirt_size',
      'travel_reimbursement',
      'first_hackathon',
      'email',
      'academic_year',
      'major',
      'uid',
      'eighteenBeforeEvent',
      'mlh_coc',
      'mlh_dcp',
    ],
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
  locationSchema: {
    type: 'object',
    properties: {
      uid: {
        type: 'number',
      },
      location_name: {
        type: 'string',
      },
    },
    required: ['location_name'],
  },
  eventSchema: {
    type: 'object',
    properties: {
      uid: {
        type: 'string',
        min: 1,
      },
      event_location: {
        type: 'string',
        min: 1,
      },
      event_start_time: {
        type: 'number',
      },
      event_end_time: {
        type: 'number',
      },
      event_title: {
        type: 'string',
        min: 1,
      },
      event_description: {
        type: 'string',
        min: 1,
      },
      event_type: {
        enum: ['food', 'workshop', 'activity'],
      },
    },
    required: ['uid', 'event_location', 'event_start_time', 'event_end_time', 'event_title', 'event_type'],
  },
  categorySchema: {
    type: 'object',
    properties: {
      uid: {
        type: 'number',
      },
      categoryName: {
        type: 'string',
        min: 1,
        max: 50,
      },
      isSponsor: {
        type: 'boolean',
      },
    },
    required: ['uid', 'categoryName', 'isSponsor'],
  },
};
