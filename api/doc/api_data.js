define({ "api": [  {    "type": "post",    "url": "/admin/makeadmin",    "title": "Elevate a user's privileges",    "version": "0.1.1",    "name": "Elevate_user",    "group": "Admin",    "permission": [      {        "name": "Exec"      }    ],    "parameter": {      "fields": {        "Parameter": [          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "uid",            "description": "<p>The UID of the user to elevate privileges</p>"          },          {            "group": "Parameter",            "type": "Number",            "optional": false,            "field": "privilege",            "description": "<p>[Default = 1] The privilege level to set to {1: Volunteer, 2: Team Member, 3: Exec, 4: Tech-Exec}</p>"          }        ]      }    },    "success": {      "fields": {        "Success 200": [          {            "group": "Success 200",            "type": "String",            "optional": false,            "field": "Success",            "description": ""          }        ]      }    },    "filename": "routes/admin.js",    "groupTitle": "Admin",    "header": {      "fields": {        "Headers": [          {            "group": "Headers",            "type": "String",            "optional": false,            "field": "idtoken",            "description": "<p>The Firebase IdToken</p>"          }        ]      }    },    "error": {      "fields": {        "Error 4xx": [          {            "group": "Error 4xx",            "optional": false,            "field": "IllegalArgument",            "description": "<p>The passed argument was not found or illegal</p>"          }        ]      },      "examples": [        {          "title": "Error-Response:",          "content": "HTTP/1.1 400 IllegalArgument\n{\n  \"error\": \"The pased argument was illegal\"\n}",          "type": "json"        }      ]    }  },  {    "type": "get",    "url": "/admin/userid",    "title": "Get the uid corresponding to an email",    "version": "0.2.0",    "name": "Get_User_Id",    "group": "Admin",    "permission": [      {        "name": "Exec"      }    ],    "parameter": {      "fields": {        "Parameter": [          {            "group": "Parameter",            "type": "string",            "optional": false,            "field": "email",            "description": "<p>The email to query user id by</p>"          }        ]      }    },    "success": {      "fields": {        "Success 200": [          {            "group": "Success 200",            "type": "object",            "optional": false,            "field": "Object",            "description": "<p>{uid, displayName}</p>"          }        ]      }    },    "filename": "routes/admin.js",    "groupTitle": "Admin",    "header": {      "fields": {        "Headers": [          {            "group": "Headers",            "type": "String",            "optional": false,            "field": "idtoken",            "description": "<p>The Firebase IdToken</p>"          }        ]      }    },    "error": {      "fields": {        "Error 4xx": [          {            "group": "Error 4xx",            "optional": false,            "field": "IllegalArgument",            "description": "<p>The passed argument was not found or illegal</p>"          }        ]      },      "examples": [        {          "title": "Error-Response:",          "content": "HTTP/1.1 400 IllegalArgument\n{\n  \"error\": \"The pased argument was illegal\"\n}",          "type": "json"        }      ]    }  },  {    "type": "get",    "url": "/admin/preregistered",    "title": "Get pre-registered hackers",    "version": "0.2.2",    "name": "Pre_registered_Hackers",    "group": "Admin",    "permission": [      {        "name": "Team Member"      }    ],    "parameter": {      "fields": {        "Parameter": [          {            "group": "Parameter",            "type": "Number",            "optional": false,            "field": "limit",            "defaultValue": "Math.inf",            "description": "<p>Limit to a certain number of responses</p>"          },          {            "group": "Parameter",            "type": "Number",            "optional": false,            "field": "offset",            "defaultValue": "0",            "description": "<p>The offset to start retrieving users from. Useful for pagination</p>"          }        ]      }    },    "success": {      "fields": {        "Success 200": [          {            "group": "Success 200",            "type": "Array",            "optional": false,            "field": "Array",            "description": "<p>of registered hackers</p>"          }        ]      }    },    "filename": "routes/admin.js",    "groupTitle": "Admin",    "header": {      "fields": {        "Headers": [          {            "group": "Headers",            "type": "String",            "optional": false,            "field": "idtoken",            "description": "<p>The Firebase IdToken</p>"          }        ]      }    }  },  {    "type": "get",    "url": "/admin/preregistered",    "title": "Get pre-registered hackers",    "version": "0.1.1",    "name": "Pre_registered_Hackers",    "group": "Admin",    "permission": [      {        "name": "Team Member"      }    ],    "parameter": {      "fields": {        "Parameter": [          {            "group": "Parameter",            "type": "Number",            "optional": false,            "field": "limit",            "defaultValue": "Math.inf",            "description": "<p>Limit to a certain number of responses</p>"          }        ]      }    },    "success": {      "fields": {        "Success 200": [          {            "group": "Success 200",            "type": "Array",            "optional": false,            "field": "Array",            "description": "<p>of registered hackers</p>"          }        ]      }    },    "filename": "routes/admin.js",    "groupTitle": "Admin",    "header": {      "fields": {        "Headers": [          {            "group": "Headers",            "type": "String",            "optional": false,            "field": "idtoken",            "description": "<p>The Firebase IdToken</p>"          }        ]      }    }  },  {    "type": "get",    "url": "/admin/registered",    "title": "Get registered hackers",    "version": "0.2.2",    "name": "Registered_Hackers",    "group": "Admin",    "permission": [      {        "name": "Team Member"      }    ],    "parameter": {      "fields": {        "Parameter": [          {            "group": "Parameter",            "type": "Number",            "optional": false,            "field": "limit",            "defaultValue": "Math.inf",            "description": "<p>Limit to a certain number of responses</p>"          },          {            "group": "Parameter",            "type": "Number",            "optional": false,            "field": "offset",            "defaultValue": "0",            "description": "<p>The offset to start retrieving users from. Useful for pagination</p>"          }        ]      }    },    "success": {      "fields": {        "Success 200": [          {            "group": "Success 200",            "type": "Array",            "optional": false,            "field": "Array",            "description": "<p>of registered hackers</p>"          }        ]      }    },    "filename": "routes/admin.js",    "groupTitle": "Admin",    "header": {      "fields": {        "Headers": [          {            "group": "Headers",            "type": "String",            "optional": false,            "field": "idtoken",            "description": "<p>The Firebase IdToken</p>"          }        ]      }    }  },  {    "type": "get",    "url": "/admin/registered",    "title": "Get registered hackers",    "version": "0.1.1",    "name": "Registered_Hackers",    "group": "Admin",    "permission": [      {        "name": "Team Member"      }    ],    "parameter": {      "fields": {        "Parameter": [          {            "group": "Parameter",            "type": "Number",            "optional": false,            "field": "limit",            "defaultValue": "Math.inf",            "description": "<p>Limit to a certain number of responses</p>"          }        ]      }    },    "success": {      "fields": {        "Success 200": [          {            "group": "Success 200",            "type": "Array",            "optional": false,            "field": "Array",            "description": "<p>of registered hackers</p>"          }        ]      }    },    "filename": "routes/admin.js",    "groupTitle": "Admin",    "header": {      "fields": {        "Headers": [          {            "group": "Headers",            "type": "String",            "optional": false,            "field": "idtoken",            "description": "<p>The Firebase IdToken</p>"          }        ]      }    }  },  {    "type": "post",    "url": "/admin/email",    "title": "Send communication email to recipients",    "version": "0.1.1",    "name": "Send_communication_emails",    "group": "Admin",    "permission": [      {        "name": "Exec"      }    ],    "parameter": {      "fields": {        "Parameter": [          {            "group": "Parameter",            "type": "Object[]",            "optional": false,            "field": "emails",            "description": "<p>An array of objects with the following schema { email: <email>, name: <name of person>, substitutions: {...} } Substitutions is a map { keyword: substitute-text }</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "subject",            "description": "<p>The subject of the email to send</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "html",            "description": "<p>The HTML/text email to send. Make sure that all words that need to be substituted have matching substitutes in each object in the emails array</p>"          }        ]      },      "examples": [        {          "title": "Request-Example:",          "content": "{\n  emails: [{\n      email: abc@email.com,\n      name: Name,\n      substitutions: {\n        date: '29-03-2014',\n        language: 'english',\n        ...,\n        }\n      },\n      {...},\n      ...],\n  fromEmail: \"Email address send from and reply to. *NOTE: email are case sensitive\"\n  subject: \"generic email\",\n  html: \"<html><head><body>.....</body></head></html>\"\n}",          "type": "Object"        }      ]    },    "success": {      "fields": {        "200": [          {            "group": "200",            "type": "Object[]",            "optional": false,            "field": "Responses",            "description": "<p>All responses from the emails sent</p>"          }        ],        "207": [          {            "group": "207",            "type": "Object[]",            "optional": false,            "field": "Partial-Success",            "description": "<p>An array of success responses as well as failure objects</p>"          }        ]      }    },    "filename": "routes/admin.js",    "groupTitle": "Admin",    "header": {      "fields": {        "Headers": [          {            "group": "Headers",            "type": "String",            "optional": false,            "field": "idtoken",            "description": "<p>The Firebase IdToken</p>"          }        ]      }    }  },  {    "type": "post",    "url": "/register/pre",    "title": "Pre-register for HackPSU",    "version": "0.1.1",    "name": "Pre_Registration",    "group": "Registration",    "parameter": {      "fields": {        "Parameter": [          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "email",            "description": "<p>The email ID to register with</p>"          }        ]      }    },    "permission": [      {        "name": "None"      }    ],    "success": {      "fields": {        "Success 200": [          {            "group": "Success 200",            "type": "String",            "optional": false,            "field": "Success",            "description": ""          }        ]      }    },    "filename": "routes/register.js",    "groupTitle": "Registration",    "error": {      "fields": {        "Error 4xx": [          {            "group": "Error 4xx",            "optional": false,            "field": "IllegalArgument",            "description": "<p>The passed argument was not found or illegal</p>"          }        ]      },      "examples": [        {          "title": "Error-Response:",          "content": "HTTP/1.1 400 IllegalArgument\n{\n  \"error\": \"The pased argument was illegal\"\n}",          "type": "json"        }      ]    }  },  {    "type": "post",    "url": "/register/",    "title": "Register for HackPSU",    "version": "0.1.1",    "name": "Registration",    "group": "Registration",    "parameter": {      "fields": {        "Parameter": [          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "firstname",            "description": "<p>First name of the user</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "lastname",            "description": "<p>Last name of the user</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "gender",            "description": "<p>Gender of the user</p>"          },          {            "group": "Parameter",            "type": "enum",            "optional": false,            "field": "shirt_size",            "description": "<p>[XS, S, M, L, XL, XXL]</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": true,            "field": "dietary_restriction",            "description": "<p>The dietary restictions for the user</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": true,            "field": "allergies",            "description": "<p>Any allergies the user might have</p>"          },          {            "group": "Parameter",            "type": "boolean",            "optional": false,            "field": "travelReimbursement",            "defaultValue": "false",            "description": ""          },          {            "group": "Parameter",            "type": "boolean",            "optional": false,            "field": "firstHackathon",            "defaultValue": "false",            "description": "<p>Is this the user's first hackathon</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "university",            "description": "<p>The university that the user attends</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "email",            "description": "<p>The user's school email</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "academicYear",            "description": "<p>The user's current year in school</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "major",            "description": "<p>Intended or current major</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "phone",            "description": "<p>The user's phone number (For MLH)</p>"          },          {            "group": "Parameter",            "type": "FILE",            "optional": true,            "field": "resume",            "description": "<p>The resume file for the user (Max size: 10 MB)</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": true,            "field": "ethnicity",            "description": "<p>The user's ethnicity</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "codingExperience",            "description": "<p>The coding experience that the user has</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "uid",            "description": "<p>The UID from their Firebase account</p>"          },          {            "group": "Parameter",            "type": "boolean",            "optional": false,            "field": "eighteenBeforeEvent",            "defaultValue": "true",            "description": "<p>Will the person be eighteen before the event</p>"          },          {            "group": "Parameter",            "type": "boolean",            "optional": false,            "field": "mlhcoc",            "defaultValue": "true",            "description": "<p>Does the user agree to the mlhcoc?</p>"          },          {            "group": "Parameter",            "type": "boolean",            "optional": false,            "field": "mlhdcp",            "defaultValue": "true",            "description": "<p>Does the user agree to the mlh dcp?</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "referral",            "description": "<p>Where did the user hear about the Hackathon?</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "project",            "description": "<p>A project description that the user is proud of</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "expectations",            "description": "<p>What the user expects to get from the hackathon</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "veteran",            "defaultValue": "false",            "description": "<p>Is the user a veteran?</p>"          }        ]      }    },    "permission": [      {        "name": "valid user credentials"      }    ],    "success": {      "fields": {        "Success 200": [          {            "group": "Success 200",            "type": "String",            "optional": false,            "field": "Success",            "description": ""          }        ]      }    },    "filename": "routes/register.js",    "groupTitle": "Registration",    "header": {      "fields": {        "Headers": [          {            "group": "Headers",            "type": "String",            "optional": false,            "field": "idtoken",            "description": "<p>The Firebase IdToken</p>"          }        ]      }    },    "error": {      "fields": {        "Error 4xx": [          {            "group": "Error 4xx",            "optional": false,            "field": "IllegalArgument",            "description": "<p>The passed argument was not found or illegal</p>"          }        ]      },      "examples": [        {          "title": "Error-Response:",          "content": "HTTP/1.1 400 IllegalArgument\n{\n  \"error\": \"The pased argument was illegal\"\n}",          "type": "json"        }      ]    }  },  {    "type": "get",    "url": "/users",    "title": "Get the privilege information for the current user",    "version": "0.1.2",    "name": "Get_user_privilege_information",    "group": "Users",    "permission": [      {        "name": "User"      }    ],    "success": {      "fields": {        "Success 200": [          {            "group": "Success 200",            "type": "Object",            "optional": false,            "field": "JSON",            "description": "<p>Object with user's data</p>"          }        ]      }    },    "filename": "routes/users.js",    "groupTitle": "Users",    "header": {      "fields": {        "Headers": [          {            "group": "Headers",            "type": "String",            "optional": false,            "field": "idtoken",            "description": "<p>The Firebase IdToken</p>"          }        ]      }    }  },  {    "type": "get",    "url": "/users/registration",    "title": "Get the registration information for the current user",    "version": "0.2.1",    "name": "Get_user_registration_information",    "group": "Users",    "permission": [      {        "name": "User"      }    ],    "success": {      "fields": {        "Success 200": [          {            "group": "Success 200",            "type": "Object",            "optional": false,            "field": "JSON",            "description": "<p>Object with user's data</p>"          }        ]      }    },    "filename": "routes/users.js",    "groupTitle": "Users",    "header": {      "fields": {        "Headers": [          {            "group": "Headers",            "type": "String",            "optional": false,            "field": "idtoken",            "description": "<p>The Firebase IdToken</p>"          }        ]      }    }  },  {    "type": "socket.io",    "url": "/live/updates/:upstream-event",    "title": "Create new event",    "version": "0.3.1",    "name": "Create_new_event",    "group": "Websocket",    "permission": [      {        "name": "Team Member"      }    ],    "parameter": {      "fields": {        "Parameter": [          {            "group": "Parameter",            "type": "string",            "optional": false,            "field": "event_location",            "description": "<p>UID of the location that the event takes place at</p>"          },          {            "group": "Parameter",            "type": "number",            "optional": false,            "field": "event_start_time",            "description": "<p>The epoch start time of the event</p>"          },          {            "group": "Parameter",            "type": "number",            "optional": false,            "field": "event_end",            "description": "<p>The epoch end time of the event</p>"          },          {            "group": "Parameter",            "type": "string",            "optional": false,            "field": "event_title",            "description": "<p>Title of the event</p>"          },          {            "group": "Parameter",            "type": "string",            "optional": false,            "field": "event_description",            "description": "<p>Description of the event</p>"          },          {            "group": "Parameter",            "type": "enum",            "optional": false,            "field": "event_type",            "description": "<p>The type of event. Possible types are: 'food', 'workshop', 'activity'</p>"          }        ]      }    },    "success": {      "fields": {        "Success 200": [          {            "group": "Success 200",            "type": "Event",            "optional": false,            "field": "broadcasted",            "description": "<p>on socket room 'event'</p>"          }        ]      }    },    "filename": "routes/sockets.js",    "groupTitle": "Websocket",    "header": {      "fields": {        "Headers": [          {            "group": "Headers",            "type": "String",            "optional": false,            "field": "idtoken",            "description": "<p>The Firebase IdToken</p>"          }        ]      }    }  },  {    "type": "socket.io",    "url": "/live/events/:connection",    "title": "Get calendar events",    "version": "0.3.1",    "name": "Get_calendar_events",    "group": "Websocket",    "permission": [      {        "name": "Hacker"      }    ],    "success": {      "fields": {        "Success 200": [          {            "group": "Success 200",            "type": "Array",            "optional": false,            "field": "Array",            "description": "<p>of calendar events</p>"          }        ]      }    },    "filename": "routes/sockets.js",    "groupTitle": "Websocket",    "header": {      "fields": {        "Headers": [          {            "group": "Headers",            "type": "String",            "optional": false,            "field": "idtoken",            "description": "<p>The Firebase IdToken</p>"          }        ]      }    }  },  {    "type": "socket.io",    "url": "/live/updates/:connection",    "title": "Get live updates",    "version": "0.3.1",    "name": "Get_live_updates",    "group": "Websocket",    "permission": [      {        "name": "Hacker"      }    ],    "success": {      "fields": {        "Success 200": [          {            "group": "Success 200",            "type": "Array",            "optional": false,            "field": "Array",            "description": "<p>of live updates</p>"          }        ]      }    },    "filename": "routes/sockets.js",    "groupTitle": "Websocket",    "header": {      "fields": {        "Headers": [          {            "group": "Headers",            "type": "String",            "optional": false,            "field": "idtoken",            "description": "<p>The Firebase IdToken</p>"          }        ]      }    }  },  {    "type": "socket.io",    "url": "/live/updates/:upstream-update",    "title": "Publish live update",    "version": "0.3.1",    "name": "Publish_live_update",    "group": "Websocket",    "permission": [      {        "name": "Team Member"      }    ],    "parameter": {      "fields": {        "Parameter": [          {            "group": "Parameter",            "type": "string",            "optional": false,            "field": "title",            "description": "<p>The title of the update</p>"          },          {            "group": "Parameter",            "type": "File",            "optional": false,            "field": "image",            "description": "<p>The image to include with the update</p>"          },          {            "group": "Parameter",            "type": "string",            "optional": false,            "field": "message",            "description": "<p>The message to send with the update</p>"          },          {            "group": "Parameter",            "type": "boolean",            "optional": false,            "field": "push_notification",            "description": "<p>true if the live update should also be pushed to user devices</p>"          }        ]      }    },    "success": {      "fields": {        "Success 200": [          {            "group": "Success 200",            "type": "Update",            "optional": false,            "field": "broadcasted",            "description": "<p>on socket room 'update'</p>"          }        ]      }    },    "filename": "routes/sockets.js",    "groupTitle": "Websocket",    "header": {      "fields": {        "Headers": [          {            "group": "Headers",            "type": "String",            "optional": false,            "field": "idtoken",            "description": "<p>The Firebase IdToken</p>"          }        ]      }    }  },  {    "type": "socket.io",    "url": "/live/updates/:update-event",    "title": "Update event",    "version": "0.3.1",    "name": "Update_event",    "group": "Websocket",    "permission": [      {        "name": "Team Member"      }    ],    "parameter": {      "fields": {        "Parameter": [          {            "group": "Parameter",            "type": "string",            "optional": false,            "field": "uid",            "description": "<p>UID of the event to update</p>"          },          {            "group": "Parameter",            "type": "string",            "optional": false,            "field": "event_location",            "description": "<p>UID of the location that the event takes place at</p>"          },          {            "group": "Parameter",            "type": "number",            "optional": false,            "field": "event_start_time",            "description": "<p>The epoch start time of the event</p>"          },          {            "group": "Parameter",            "type": "number",            "optional": false,            "field": "event_end",            "description": "<p>The epoch end time of the event</p>"          },          {            "group": "Parameter",            "type": "string",            "optional": false,            "field": "event_title",            "description": "<p>Title of the event</p>"          },          {            "group": "Parameter",            "type": "string",            "optional": false,            "field": "event_description",            "description": "<p>Description of the event</p>"          },          {            "group": "Parameter",            "type": "enum",            "optional": false,            "field": "event_type",            "description": "<p>The type of event. Possible types are: 'food', 'workshop', 'activity'</p>"          }        ]      }    },    "success": {      "fields": {        "Success 200": [          {            "group": "Success 200",            "type": "Event",            "optional": false,            "field": "broadcasted",            "description": "<p>on socket room 'event-updated'</p>"          }        ]      }    },    "filename": "routes/sockets.js",    "groupTitle": "Websocket",    "header": {      "fields": {        "Headers": [          {            "group": "Headers",            "type": "String",            "optional": false,            "field": "idtoken",            "description": "<p>The Firebase IdToken</p>"          }        ]      }    }  }] });
