/* eslint-disable max-len,no-param-reassign,consistent-return */
const validator = require('email-validator');
const Ajv = require('ajv');
const transform = require('parallel-transform');
const express = require('express');
const Stringify = require('streaming-json-stringify');
const _ = require('lodash');
const emailObjectSchema = require('../assets/schemas/load-schemas')('emailObjectSchema');
const authenticator = require('../services/auth');
const database = require('../services/database');
const {
  errorHandler500,
  emailSubstitute,
  createEmailRequest,
  streamHandler,
  sendEmail,
} = require('../services/functions');
const { Registration } = require('../models/Registration');
const { PreRegistration } = require('../models/PreRegistration');
const { RSVP } = require('../models/RSVP');
const { Attendance } = require('../models/Attendance');
const { Location } = require('../models/Location');

const ajv = new Ajv({ allErrors: true });


const router = express.Router();


/** **************** HELPER MIDDLEWARE ************************* */

/**
 * Administrator authentication middleware
 */
router.use((req, res, next) => {
  if (process.env.NODE_ENV === 'debug') {
    // Remove if you require idtoken support locally
    return next();
  }
  if (!req.headers.idtoken) {
    const error = new Error();
    error.status = 401;
    error.body = { error: 'ID Token must be provided' };
    return next(error);
  }
  authenticator.checkAuthentication(req.headers.idtoken)
    .then((decodedToken) => {
      if (decodedToken.admin === true) {
        res.locals.privilege = decodedToken.privilege;
        res.locals.user = decodedToken;
        return next();
      }
      const error = new Error();
      error.status = 401;
      error.body = { error: 'You do not have sufficient permissions for this operation' };
      next(error);
    })
    .catch((err) => {
      const error = new Error();
      error.status = 401;
      error.body = err.message;
      return next(error);
    });
});

router.use((req, res, next) => {
  if (!req.query.limit || parseInt(req.query.limit, 10)) {
    res.locals.limit = parseInt(req.query.limit, 10);
  } else {
    const error = new Error();
    error.status = 400;
    error.body = { message: 'Limit must be an integer' };
    return next(error);
  }
  if (!req.query.offset || parseInt(req.query.offset, 10)) {
    res.locals.offset = parseInt(req.query.offset, 10);
  } else {
    const error = new Error();
    error.status = 400;
    error.body = { message: 'Offset must be an integer' };
    return next(error);
  }
  return next();
});


/**
 * This function adds the following arrays to the res.locals object:
 *  successArray: Contains all email objects that have follow the schema
 *  failArray:    Contains all the email objects that fail the schema
 * @param req
 * @param res
 * @param next
 */
function validateEmails(req, res, next) {
  if (!(req.body && req.body.emails && Array.isArray(req.body.emails))) {
    const error = new Error();
    error.status = 400;
    error.body = { error: 'Emails must be provided as an array' };
    return next(error);
  }
  if (!(req.body.html && typeof req.body.html === 'string')) {
    const error = new Error();
    error.status = 400;
    error.body = { error: 'Email subject must be provided' };
    return next(error);
  }
  // Run validation
  const validate = ajv.compile(emailObjectSchema);
  const successArray = [];
  const failArray = [];
  req.body.emails.map((emailObject) => {
    if (validate(emailObject)) {
      successArray.push(emailObject);
    } else {
      failArray.push(Object.assign(
        emailObject,
        { error: ajv.errorsText(validate.errors) },
      ));
    }
    return true;
  });
  res.locals.successArray = successArray;
  res.locals.failArray = failArray;
  next();
}

/**
 * This function checks if the current user has the permissions required to access the function
 * @param {Number} level The level of access [1,4] that the function needs
 * @return {Function}
 */
function verifyACL(level) {
  return function (req, res, next) {
    if (process.env.NODE_ENV === 'debug') {
      // Remove if you require idtoken support locally
      return next();
    }
    if (!res.locals.privilege) {
      const error = new Error();
      error.status = 500;
      error.body = { error: 'Something went wrong while accessing permissions' };
      return next(error);
    }
    if (res.locals.privilege < level) {
      const error = new Error();
      error.status = 401;
      error.body = { error: 'You do not have sufficient permissions for this operation' };
      return next(error);
    }
    next();
  };
}


/** ********************** ROUTES ******************************** */

router.get('/', (req, res) => {
  res.status(200)
    .send({ response: 'authorized' });
});

/**
 * @api {get} /admin/registered Get registered hackers
 * @apiVersion 0.1.1
 * @apiName Registered Hackers
 * @apiGroup Admin
 * @apiPermission Team Member
 *
 * @apiParam {Number} limit=Math.inf Limit to a certain number of responses
 *
 * @apiUse AuthArgumentRequired
 *
 * @apiSuccess {Array} Array of registered hackers
 */
/**
 * @api {get} /admin/registered Get registered hackers
 * @apiVersion 0.2.2
 * @apiName Registered Hackers
 * @apiGroup Admin
 * @apiPermission Team Member
 *
 * @apiParam {Number} limit=Math.inf Limit to a certain number of responses
 * @apiParam {Number} offset=0 The offset to start retrieving users from. Useful for pagination
 *
 * @apiUse AuthArgumentRequired
 *
 * @apiSuccess {Array} Array of registered hackers
 */
router.get('/registered', verifyACL(2), (req, res, next) => {
  Registration.getAll(req.uow, {
    count: res.locals.limit,
    limit: res.locals.offset,
  })
    .then((stream) => {
      stream
        .pipe(Stringify())
        .on('error', err => errorHandler500(err, next))
        .pipe(res.type('json'))
        .on('end', res.status(200).end);
    })
    .catch(err => errorHandler500(err, next));
});

/**
 * @api {get} /admin/preregistered Get pre-registered hackers
 * @apiVersion 0.1.1
 * @apiName Pre-registered Hackers
 * @apiGroup Admin
 * @apiPermission Team Member
 * @apiParam {Number} limit=Math.inf Limit to a certain number of responses
 *
 * @apiUse AuthArgumentRequired
 *
 * @apiSuccess {Array} Array of registered hackers
 */
/**
 * @api {get} /admin/preregistered Get pre-registered hackers
 * @apiVersion 0.2.2
 * @apiName Pre-registered Hackers
 * @apiGroup Admin
 * @apiPermission Team Member
 * @apiParam {Number} limit=Math.inf Limit to a certain number of responses
 * @apiParam {Number} offset=0 The offset to start retrieving users from. Useful for pagination
 *
 * @apiUse AuthArgumentRequired
 *
 * @apiSuccess {Array} Array of registered hackers
 */
router.get('/preregistered', verifyACL(2), (req, res, next) => {
  PreRegistration.getAll(req.uow, {
    count: res.locals.limit,
    limit: res.locals.offset,
  })
    .then(stream => streamHandler(stream, res, next))
    .catch(err => errorHandler500(err, next));
});


/**
 * @api {get} /admin/userid Get the uid corresponding to an email
 * @apiVersion 0.2.0
 * @apiName Get User Id
 * @apiGroup Admin
 * @apiPermission Exec
 *
 * @apiUse AuthArgumentRequired
 * @apiParam {string} email The email to query user id by
 * @apiSuccess {object} Object {uid, displayName}
 * @apiUse IllegalArgumentError
 */
router.get('/userid', verifyACL(3), (req, res, next) => {
  if (!req.query ||
    !req.query.email ||
    !validator.validate(req.query.email)) {
    const error = new Error();
    error.status = 400;
    error.body = { error: 'request query must be set and a valid email' };
    return next(error);
  }
  authenticator.getUserId(req.query.email)
    .then((user) => {
      res.status(200)
        .send({
          uid: user.uid,
          displayName: user.displayName,
        });
    })
    .catch(error => errorHandler500(error, next));
});

/**
 * @api {get} /admin/rsvp_list Get list of people who rsvp
 * @apiVersion 0.1.0
 * @apiName Retrieve RSVP list
 * @apiGroup Admin
 * @apiPermission Exec

 * @apiParam {Number} limit=Math.inf Limit to a certain number of responses
 * @apiParam {Number} offset=0 The offset to start retrieving users from. Useful for pagination
 *
 * @apiUse AuthArgumentRequired
 *
 * @apiSuccess {Array} Array of hackers who RSVP
 */
router.get('/rsvp_list', verifyACL(3), (req, res, next) => {
  RSVP.getAll(req.uow, {
    count: res.locals.limit,
    limit: res.locals.offset,
  })
    .then(stream => streamHandler(stream, res, next))
    .catch(err => errorHandler500(err, next));
});

/**
 * @api {post} /admin/update_registration Update an existing registration
 * @apiVersion 0.3.3
 * @apiName Update Registration
 * @apiGroup Admin
 * @apiPermission Exec
 * @apiParam {Object} registration The updated registration object.
 * @apiUse AuthArgumentRequired
 */
router.post('/update_registration', verifyACL(3), (req, res, next) => {
  if (!req.body || !req.body.registration) {
    const error = new Error();
    error.status = 400;
    error.body = { message: 'Updated registration data must be provided' };
    return next(error);
  }
  const updatedRegistration = new Registration(req.body.registration, req.uow);
  if (!updatedRegistration.mlh_coc ||
    !updatedRegistration.mlh_dcp ||
    !updatedRegistration.eighteenBeforeEvent) {
    const error = new Error();
    error.status = 400;
    error.body = { message: 'Must agree to MLH terms and be over eighteen' };
    return next(error);
  }
  updatedRegistration
    .update(req.body.registration.uid, 'uid')
    .then(() => res.status(200)
      .send({ status: 'Success' }))
    .catch((err) => {
      const error = new Error();
      error.status = 400;
      error.body = err.message;
      next(error);
    });
});

/**
 * @api {get} /admin/attendance_list retrieve the list of people who attended
 * @apiVersion 0.3.2
 * @apiName Retrieve Attendance List
 * @apiGroup Admin
 * @apiPermission Exec
 *
 * @apiUse AuthArgumentRequired
 * @apiSuccess {Array} Array of hackers who attended
 */
router.get('/attendance_list', verifyACL(2), (req, res, next) => {
  Attendance.getAll(req.uow)
    .then(stream => streamHandler(stream, res, next))
    .catch(err => errorHandler500(err, next));
});

// /**
//  *
// // TODO: remove this route on open source version
// router.get('/rsvp_attendance', verifyACL(2), (req, res, next) => {
//   const arr = [];
//   database.getAttendanceHackedRsvpSpringMess()
//     .on('data', (document) => {
//       arr.push(document);
//     }).on('err', (err) => {
//     const error = new Error();
//     error.status = 500;
//     error.body = err.message;
//     next(error);
//   }).on('end', () => {
//     Promise.all(arr.map(value => new Promise((resolve, reject) => {
//       authenticator.getUserData(value.uid)
//         .then((user) => {
//           value.sign_up_time = new Date(user.metadata.creationTime).getTime();
//           resolve(value);
//         }).catch(err => reject(err));
//     }))).then(result => res.status(200).send(result))
//       .catch((err) => {
//         res.status(207).send(arr);
//       });
//   });
// });

/**
 * @api {post} /admin/makeadmin Elevate a user's privileges
 * @apiVersion 0.1.1
 * @apiName Elevate user
 *
 * @apiGroup Admin
 * @apiPermission Exec
 *
 * @apiUse AuthArgumentRequired
 * @apiParam {String} uid The UID of the user to elevate privileges
 * @apiParam {Number} privilege [Default = 1] The privilege level to set to {1: Volunteer, 2: Team Member, 3: Exec, 4: Tech-Exec}
 * @apiSuccess {String} Success
 * @apiUse IllegalArgumentError
 */
router.post('/makeadmin', verifyACL(3), (req, res, next) => {
  if (!req.body || !req.body.uid) {
    const error = new Error();
    error.status = 400;
    error.body = { error: 'UID must be provided' };
    return next(error);
  }
  const privilege = (req.body.privilege && parseInt(req.body.privilege, 10)) || 1;
  // If not tech-exec and attempting to reduce permissions
  if ((res.locals.privilege < 4) && privilege < res.locals.privilege) {
    const error = new Error();
    error.status = 400;
    error.body = { message: 'You cannot reduce privileges' };
    return next(error);
  }
  authenticator.elevate(req.body.uid, privilege)
    .then(() => {
      res.status(200)
        .send({ status: 'Success' });
    })
    .catch((err) => {
      const error = new Error();
      error.status = 500;
      error.body = err.message;
      next(error);
    });
});

/**
 * @api {get} /admin/location_list Get the list of existing location from the database
 * @apiVersion 0.2.3
 * @apiName Get Location List
 * @apiGroup Admin
 * @apiPermission Exec
 *
 * @apiUse AuthArgumentRequired
 * @apiSuccess {Array} Array containing all locations in the database
 */
router.get('/location_list', verifyACL(3), (req, res, next) => {
  Location.getAll(req.uow)
    .then(stream => streamHandler(stream, res, next))
    .catch(err => errorHandler500(err, next));
});

/**
 * @api {post} /admin/create_location Insert a new location in to the database
 * @apiVersion 0.2.3
 * @apiName Create Location
 * @apiGroup Admin
 * @apiPermission Exec
 *
 * @apiParam {String} locationName - the name of the new location that is to be inserted into the database
 * @apiUse AuthArgumentRequired
 * @apiSuccess {String} Success
 * @apiUse IllegalArgumentError
 */
router.post('/create_location', verifyACL(3), (req, res, next) => {
  if (!req.body ||
    !req.body.locationName ||
    req.body.locationName.length === 0) {
    const error = new Error();
    error.status = 400;
    error.body = 'Require a name for the location';
    return next(error);
  }
  const location = new Location({ locationName: req.body.locationName }, req.uow);
  location.add()
    .then(() => {
      res.status(200)
        .send({ status: 'Success' });
    })
    .catch(errorHandler500);
});


/**
 * @api {post} /admin/update_location Update name of the location associated with the uid in the database
 * @apiVersion 0.2.3
 * @apiName Update Location
 * @apiGroup Admin
 * @apiPermission Exec
 *
 * @apiParam {String} uid - the uid that is having the name of the location associated with this id changed
 * @apiParam {String} locationName - the new name that is being updated with the name associated with the uid
 * @apiUse AuthArgumentRequired
 * @apiSuccess {String} Success
 * @apiUse IllegalArgumentError
 */

router.post('/update_location', verifyACL(3), (req, res, next) => {
  if (!req.body ||
    !req.body.uid ||
    !req.body.location_name ||
    req.body.location_name.length === 0 ||
    req.body.uid.length === 0) {
    const error = new Error();
    error.status = 400;
    error.body = 'Require the uid and/or name for the location';
    return next(error);
  }
  const location = new Location(req.body, req.uow);
  location.update(req.body.uid, 'uid')
    .then(() => {
      res.status(200)
        .send({ status: 'Success' });
    })
    .catch(err => errorHandler500(err, next));
});

/**
 * @api {post} /admin/remove_location Remove the location associated with the uid from the database
 * @apiVersion 0.2.3
 * @apiName Remove Location
 * @apiGroup Admin
 * @apiPermission Exec
 *
 * @apiParam {String} uid - the uid of the location that is being selected for removal
 * @apiUse AuthArgumentRequired
 * @apiSuccess {String} Success
 * @apiUse IllegalArgumentError
 */
router.post('/remove_location', verifyACL(3), (req, res, next) => {
  if (!req.body ||
    !req.body.uid ||
    req.body.uid.length === 0) {
    const error = new Error();
    error.status = 400;
    error.body = 'Require the uid for the location';
    return next(error);
  }
  const location = new Location({ uid: req.body.uid }, req.uow);
  location.delete(req.body.uid)
    .then(() => {
      res.status(200)
        .send({ status: 'Success' });
    })
    .catch(err => errorHandler500(err, next));
});

/**
 * @api {get} /admin/extra_credit_list Retrieve the list of class that are providing extra credit
 * @apiName Get Extra Credit Class List
 * @apiVersion 0.3.2
 *
 * @apiGroup Admin
 * @apiPermission Exec
 *
 * @apiUse AuthArgumentRequired
 * @apiSuccess {Array} Array containing the list of class offering extra credit
 */

router.get('/extra_credit_list', verifyACL(2), (req, res, next) => {
  database.getExtraCreditClassList(req.uow)
    .then(stream => streamHandler(stream, res, next))
    .catch(err => errorHandler500(err, next));
});

/**
 * @api {post} /admin/assign_extra_credit setting user with the class they are receiving extra credit
 * @apiName Assign Extra Credit
 * @apiVersion 0.3.2
 * @apiGroup Admin
 * @apiPermission Exec
 *
 * @apiParam {String} uid - the id associated with the student
 * @apiParam {String} cid - the id associated with the class
 * @apiUse AuthArgumentRequired
 * @apiSuccess {String} Success
 * @apiUse IllegalArgumentError
 */
router.post('/assign_extra_credit', verifyACL(3), (req, res, next) => {
  if (!req.body ||
    !req.body.uid ||
    !req.body.cid ||
    !parseInt(req.body.cid, 10)) {
    const error = new Error();
    error.status = 400;
    error.body = 'Need a proper id for the class or the hacker (int)';
    return next(error);
  }
  database.assignExtraCredit(req.uow, req.body.uid, req.body.cid)
    .then(() => {
      res.status(200)
        .send({ status: 'Success' });
    })
    .catch(err => errorHandler500(err, next));
});

/**
 * @api {post} /admin/email Send communication email to recipients
 * @apiVersion 0.1.1
 * @apiName Send communication emails
 *
 * @apiGroup Admin
 * @apiPermission Exec
 *
 * @apiUse AuthArgumentRequired
 * @apiParam {Object[]} emails An array of objects with the following schema { email: <email>, name: <name of person>, substitutions: {...} }
 *                   Substitutions is a map { keyword: substitute-text }
 * @apiParam {String} subject The subject of the email to send
 * @apiParam {String} html The HTML/text email to send. Make sure that all words that need to be substituted have matching substitutes in each object in the emails array
 *
 * @apiParamExample {Object} Request-Example:
 *                  {
 *                    emails: [{
 *                        email: abc@email.com,
 *                        name: Name,
 *                        substitutions: {
 *                          date: '29-03-2014',
 *                          language: 'english',
 *                          ...,
 *                          }
 *                        },
 *                        {...},
 *                        ...],
 *                    fromEmail: "Email address send from and reply to. *NOTE: email are case sensitive"
 *                    subject: "generic email",
 *                    html: "<html><head><body>.....</body></head></html>"
 *                  }
 * @apiSuccess (200) {Object[]} Responses All responses from the emails sent
 * @apiSuccess (207) {Object[]} Partial-Success An array of success responses as well as failure objects
 */
router.post('/email', verifyACL(3), validateEmails, (req, res, next) => {
  // Validation
  if (!res.locals.successArray ||
    res.locals.successArray.length === 0) {
    const error = new Error();
    error.status = 400;
    error.body = {
      text: 'All provided emails had illegal format',
      error: res.locals.failArray,
    };
    return next(error);
  }
  if (!req.body.subject ||
    typeof req.body.subject !== 'string') {
    const error = new Error();
    error.status = 400;
    error.body = { error: 'Email subject must be provided' };
    return next(error);
  }
  // All valid input
  // Send all the emails
  const promises = res.locals.successArray.map(emailObject => // For each emailObject
    // Substitute HTML with name/emails and send email
    emailSubstitute(req.body.html, emailObject.name, emailObject.substitutions)
      .then(subbedHTML =>
        // Generate the POST request
        sendEmail(createEmailRequest(
          emailObject.email,
          subbedHTML,
          req.body.subject,
          req.body.fromEmail,
        )))
      .then(request =>
        ({
          email: request.to,
          response: 'success',
          name: emailObject.name,
        }))
      .catch((error) => {
        // Else add to the failArray for the partial HTTP success response
        res.locals.failArray.push(_.assign(emailObject, error));
        return null;
      }));
  Promise.all(promises)
    .then((resolution) => {
      const resolves = resolution.filter(result => result !== null);
      if (resolves.length === 0) {
        const error = new Error();
        error.status = 500;
        error.body = {
          text: 'Emails could not be sent',
          error: res.locals.failArray,
        };
        return next(error);
      }
      database.addEmailsHistory(req.uow, resolves.map(successEmail => ({
        sender: res.locals.user.uid,
        recipient: successEmail.email,
        email_content: req.body.html,
        subject: req.body.subject,
        recipient_name: successEmail.name,
        time: new Date().getTime(),
      })), res.locals.failArray ? res.locals.failArray.map(errorEmail => ({
        sender: res.locals.user.uid,
        recipient: errorEmail.email || null,
        email_content: req.body.html || null,
        subject: req.body.subject || null,
        recipient_name: errorEmail.name || null,
        time: new Date().getTime(),
      })) : null)
        .catch(console.error);
      if (res.locals.failArray.length === 0) {
        return res.status(200)
          .send(resolves); // Full success response
      }
      // Partial success response
      res.status(207)
        .send(res.locals.failArray.concat(resolves));
    })
    .catch(console.error);
});

/**
 * @api {get} /admin/user_data Get all user data
 * @apiVersion 0.3.2
 * @apiName Get list of all users
 * @apiGroup Admin
 * @apiPermission Team Member
 *
 * @apiParam {Number} limit=Math.inf Limit to a certain number of responses
 * @apiParam {Number} offset=0 The offset to start retrieving users from. Useful for pagination
 *
 * @apiUse AuthArgumentRequired
 *
 * @apiSuccess {Array} Array of all users
 */
router.get('/user_data', verifyACL(2), (req, res, next) => {
  database.getAllUsersList(req.uow)
    .then(stream => streamHandler(stream, res, next))
    .catch(err => errorHandler500(err, next));
});

/**
 * @api {get} /admin/prereg_count Get a count of Preregistered Users
 * @apiVersion 0.3.2
 * @apiName get count preregistration
 * @apiGroup Admin
 * @apiPermission Team Member
 *
 * @apiUse AuthArgumentRequired
 *
 * @apiSuccess {Array} number of preregistered users
 */
router.get('/prereg_count', verifyACL(2), (req, res, next) => {
  PreRegistration.getCount(req.uow)
    .then(stream => streamHandler(stream, res, next))
    .catch(err => errorHandler500(err, next));
});

/**
 * @api {get} /admin/reg_count Get a count of Registered Users
 * @apiVersion 0.3.2
 * @apiName get count registration
 * @apiGroup Admin
 * @apiPermission Team Member
 *
 * @apiUse AuthArgumentRequired
 *
 * @apiSuccess {Array} number of registered users
 */
router.get('/reg_count', verifyACL(2), (req, res, next) => {
  Registration.getCount(req.uow)
    .then(stream => streamHandler(stream, res, next))
    .catch(err => errorHandler500(err, next));
});

/**
 * @api {get} /admin/rsvp_count Get a count of users who RSVP'd
 * @apiVersion 0.3.2
 * @apiName get rsvp count
 * @apiGroup Admin
 * @apiPermission Team Member
 *
 * @apiUse AuthArgumentRequired
 *
 * @apiSuccess {Array} number of users who rsvp'd
 */
router.get('/rsvp_count', verifyACL(2), (req, res, next) => {
  RSVP.getCount(req.uow)
    .then(stream => streamHandler(stream, res, next))
    .catch(err => errorHandler500(err, next));
});

/**
 * @api {get} /admin/user_count Get the count of users in each category
 * @apiVersion 0.3.2
 * @apiName user count
 * @apiGroup Admin
 * @apiPermission Team Member
 *
 * @apiUse AuthArgumentRequired
 *
 * @apiSuccess {Array} number of all users in each category (PreRegistration, Registration, RSVP, Scans)
 */
router.get('/user_count', verifyACL(2), (req, res, next) => {
  database.getAllUsersCount(req.uow)
    .then(stream => streamHandler(stream, res, next))
    .catch(err => errorHandler500(err, next));
});

/**
 * @api {get} /admin/statistics Get the count of each option for the registration options
 * @apiVersion 0.3.2
 * @apiName stats
 * @apiGroup Admin
 * @apiPermission Team Member
 *
 * @apiUse AuthArgumentRequired
 *
 * @apiSuccess {Array} Array of registration options and respective counts
 */
// TODO: Add test for route
router.get('/statistics', verifyACL(2), (req, res, next) => {
  Registration.getStatsCount(req.uow)
    .then(stream => streamHandler(stream, res, next))
    .catch(err => errorHandler500(err, next));
});

module.exports = router;

