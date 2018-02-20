define({ "api": [  {    "type": "post",    "url": "/admin/makeadmin",    "title": "Elevate a user's privileges",    "version": "0.1.1",    "name": "Elevate_user",    "group": "Admin",    "permission": [      {        "name": "Exec"      }    ],    "parameter": {      "fields": {        "Parameter": [          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "uid",            "description": "<p>The UID of the user to elevate privileges</p>"          },          {            "group": "Parameter",            "type": "Number",            "optional": false,            "field": "privilege",            "description": "<p>[Default = 1] The privilege level to set to {1: Volunteer, 2: Team Member, 3: Exec, 4: Tech-Exec}</p>"          }        ]      }    },    "success": {      "fields": {        "Success 200": [          {            "group": "Success 200",            "type": "String",            "optional": false,            "field": "Success",            "description": ""          }        ]      }    },    "filename": "routes/admin.js",    "groupTitle": "Admin",    "header": {      "fields": {        "Login": [          {            "group": "Login",            "type": "String",            "optional": false,            "field": "idtoken",            "description": "<p>The Firebase IdToken</p>"          }        ]      }    },    "error": {      "fields": {        "Error 4xx": [          {            "group": "Error 4xx",            "optional": false,            "field": "IllegalArgument",            "description": "<p>The passed argument was not found or illegal</p>"          }        ]      },      "examples": [        {          "title": "Error-Response:",          "content": "HTTP/1.1 400 IllegalArgument\n{\n  \"error\": \"The pased argument was illegal\"\n}",          "type": "json"        }      ]    }  },  {    "type": "get",    "url": "/admin/preregistered",    "title": "Get pre-registered hackers",    "version": "0.1.1",    "name": "Pre_registered_Hackers",    "group": "Admin",    "permission": [      {        "name": "Team Member"      }    ],    "parameter": {      "fields": {        "Parameter": [          {            "group": "Parameter",            "type": "Number",            "optional": false,            "field": "limit",            "defaultValue": "Math.inf",            "description": "<p>Limit to a certain number of responses</p>"          }        ]      }    },    "success": {      "fields": {        "Success 200": [          {            "group": "Success 200",            "type": "Array",            "optional": false,            "field": "Array",            "description": "<p>of registered hackers</p>"          }        ]      }    },    "filename": "routes/admin.js",    "groupTitle": "Admin",    "header": {      "fields": {        "Login": [          {            "group": "Login",            "type": "String",            "optional": false,            "field": "idtoken",            "description": "<p>The Firebase IdToken</p>"          }        ]      }    }  },  {    "type": "get",    "url": "/admin/registered",    "title": "Get registered hackers",    "version": "0.1.1",    "name": "Registered_Hackers",    "group": "Admin",    "permission": [      {        "name": "Team Member"      }    ],    "parameter": {      "fields": {        "Parameter": [          {            "group": "Parameter",            "type": "Number",            "optional": false,            "field": "limit",            "defaultValue": "Math.inf",            "description": "<p>Limit to a certain number of responses</p>"          }        ]      }    },    "success": {      "fields": {        "Success 200": [          {            "group": "Success 200",            "type": "Array",            "optional": false,            "field": "Array",            "description": "<p>of registered hackers</p>"          }        ]      }    },    "filename": "routes/admin.js",    "groupTitle": "Admin",    "header": {      "fields": {        "Login": [          {            "group": "Login",            "type": "String",            "optional": false,            "field": "idtoken",            "description": "<p>The Firebase IdToken</p>"          }        ]      }    }  },  {    "type": "post",    "url": "/admin/email",    "title": "Send communication email to recipients",    "version": "0.1.1",    "name": "Send_communication_emails",    "group": "Admin",    "permission": [      {        "name": "Exec"      }    ],    "parameter": {      "fields": {        "Parameter": [          {            "group": "Parameter",            "type": "Object[]",            "optional": false,            "field": "emails",            "description": "<p>An array of objects with the following schema { email: <email>, name: <name of person>, substitutions: {...} } Substitutions is a map { keyword: substitute-text }</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "subject",            "description": "<p>The subject of the email to send</p>"          },          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "html",            "description": "<p>The HTML/text email to send. Make sure that all words that need to be substituted have matching substitutes in each object in the emails array</p>"          }        ]      },      "examples": [        {          "title": "Request-Example:",          "content": "{\n  emails: [{\n      email: abc@email.com,\n      name: Name,\n      substitutions: {\n        date: '29-03-2014',\n        language: 'english',\n        ...,\n        }\n      },\n      {...},\n      ...],\n  subject: \"generic email\",\n  html: \"<html><head><body>.....</body></head></html>\"\n}",          "type": "Object"        }      ]    },    "success": {      "fields": {        "200": [          {            "group": "200",            "type": "Object[]",            "optional": false,            "field": "Responses",            "description": "<p>All responses from the emails sent</p>"          }        ],        "207": [          {            "group": "207",            "type": "Object[]",            "optional": false,            "field": "Partial-Success",            "description": "<p>An array of success responses as well as failure objects</p>"          }        ]      }    },    "filename": "routes/admin.js",    "groupTitle": "Admin",    "header": {      "fields": {        "Login": [          {            "group": "Login",            "type": "String",            "optional": false,            "field": "idtoken",            "description": "<p>The Firebase IdToken</p>"          }        ]      }    }  },  {    "type": "post",    "url": "/register/pre",    "title": "Pre-register for HackPSU",    "version": "0.1.1",    "name": "Pre_Registration",    "group": "Registration",    "parameter": {      "fields": {        "Parameter": [          {            "group": "Parameter",            "type": "String",            "optional": false,            "field": "email",            "description": "<p>The email ID to register with</p>"          }        ]      }    },    "permission": [      {        "name": "None"      }    ],    "success": {      "fields": {        "Success 200": [          {            "group": "Success 200",            "type": "String",            "optional": false,            "field": "Success",            "description": ""          }        ]      }    },    "filename": "routes/register.js",    "groupTitle": "Registration",    "error": {      "fields": {        "Error 4xx": [          {            "group": "Error 4xx",            "optional": false,            "field": "IllegalArgument",            "description": "<p>The passed argument was not found or illegal</p>"          }        ]      },      "examples": [        {          "title": "Error-Response:",          "content": "HTTP/1.1 400 IllegalArgument\n{\n  \"error\": \"The pased argument was illegal\"\n}",          "type": "json"        }      ]    }  },  {    "type": "post",    "url": "/register/",    "title": "Register for HackPSU",    "version": "0.1.1",    "name": "Registration",    "group": "Registration",    "parameter": {      "fields": {        "Parameter": [          {            "group": "Parameter",            "optional": false,            "field": "request",            "description": "<p>header { idtoken: user's idtoken }</p> <p>request Body { data:{ firstName: { type: 'string', minLength: 1, maxLength: 45, }, lastName: { type: 'string', minLength: 1, maxLength: 45, }, gender: { &quot;enum&quot;:  ['Male','Female','Non-Binary','Prefer not to disclose'] }, shirtSize:{ &quot;enum&quot;: ['XS','S','M','L','XL','XXL'] }, dietaryRestriction: { &quot;enum&quot;: ['Vegetarian','Vegan','Kosher','Allergies']<br> }, allergies: { type: 'string', minLength: 1, maxLength: 45, }, travelReimbursement: { type: 'boolean' }, firstHackathon: { type: 'boolean' }, university: { type: 'string', minLength: 1, maxLength: 200, }, email: { type: 'string', format: 'email'<br> }, academicYear: { &quot;enum&quot;: [&quot;Freshman&quot;, &quot;Sophomore&quot;, &quot;Junior&quot;, &quot;Senior&quot;, &quot;Graduate student&quot;, &quot;Graduated within last 12 months&quot;] }, major: { type: 'string', minLength: 1, maxLength: 100 }, phone: { type: 'string', minLength: 1, maxLength: 50 }, race: { type: 'string', maxLength: 150 }, codingExperience: { &quot;enum&quot;: [&quot;None&quot;,&quot;Beginner&quot;, &quot;Intermediate&quot;, &quot;Advanced&quot;] }, uid: { type: 'string', maxLength: 150 }, eighteenBeforeEvent: { type: 'boolean' }, mlhCOC: { type: 'boolean' }, mlhDCP: { type: 'boolean' }, referral: { type: 'string' }, project: { type: 'string' }</p> <pre><code>\t\trequired: ['firstName', 'lastName', 'gender', 'shirtSize', 'travelReimbursement', 'firstHackathon', 'email', 'academicYear', 'major', 'phone', 'codingExperience', 'uid', 'eighteenBeforeEvent', 'mlhCOC', 'mlhDCP']     },      resume: file(size must be below 10MB)}</code></pre>"          }        ]      }    },    "permission": [      {        "name": "valid user credentials"      }    ],    "success": {      "fields": {        "Success 200": [          {            "group": "Success 200",            "type": "String",            "optional": false,            "field": "Success",            "description": ""          }        ]      }    },    "filename": "routes/register.js",    "groupTitle": "Registration",    "error": {      "fields": {        "Error 4xx": [          {            "group": "Error 4xx",            "optional": false,            "field": "IllegalArgument",            "description": "<p>The passed argument was not found or illegal</p>"          }        ]      },      "examples": [        {          "title": "Error-Response:",          "content": "HTTP/1.1 400 IllegalArgument\n{\n  \"error\": \"The pased argument was illegal\"\n}",          "type": "json"        }      ]    }  },  {    "type": "get",    "url": "/users",    "title": "Get the privilege information for the current user",    "version": "0.1.2",    "name": "Get_user_privilege_information",    "group": "Users",    "permission": [      {        "name": "User"      }    ],    "success": {      "fields": {        "Success 200": [          {            "group": "Success 200",            "type": "Object",            "optional": false,            "field": "JSON",            "description": "<p>Object with user's data</p>"          }        ]      }    },    "filename": "routes/users.js",    "groupTitle": "Users",    "header": {      "fields": {        "Login": [          {            "group": "Login",            "type": "String",            "optional": false,            "field": "idtoken",            "description": "<p>The Firebase IdToken</p>"          }        ]      }    }  }] });
