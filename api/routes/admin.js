/* eslint-disable max-len,no-param-reassign */

const validator = require('email-validator');
const Ajv = require('ajv');
const transform = require('parallel-transform');
const express = require('express');
const Stringify = require('streaming-json-stringify');
const { emailObjectSchema } = require('../assets/helpers/schemas');
const authenticator = require('../assets/helpers/auth');
const database = require('../assets/helpers/database/database');
const functions = require('../assets/helpers/functions');
const Registration = require('../assets/models/Registration');
const PreRegistration = require('../assets/models/PreRegistration');
const RSVP = require('../assets/models/RSVP');
const Attendance = require('../assets/models/Attendance');
const Location = require('../assets/models/Location');

const ajv = new Ajv({ allErrors: true });


const router = express.Router();


/** **************** HELPER MIDDLEWARE ************************* */

/**
 * Administrator authentication middleware
 */
router.use((req, res, next) => {
  if (req.headers.idtoken) {
    authenticator.checkAuthentication(req.headers.idtoken)
      .then((decodedToken) => {
        if (decodedToken.admin === true) {
          res.locals.privilege = decodedToken.privilege;
          res.locals.user = decodedToken;
          next();
        } else {
          const error = new Error();
          error.status = 401;
          error.body = { error: 'You do not have sufficient permissions for this operation' };
          next(error);
        }
      }).catch((err) => {
      const error = new Error();
      error.status = 401;
      error.body = err.message;
      next(error);
    });
  } else {
    const error = new Error();
    error.status = 401;
    error.body = { error: 'ID Token must be provided' };
    next(error);
  }
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
  if (req.body && req.body.emails && Array.isArray(req.body.emails)) {
    if (req.body.html && typeof req.body.html === 'string') {
      // Run validation
      const validate = ajv.compile(emailObjectSchema);
      const successArray = [];
      const failArray = [];
      req.body.emails.map((emailObject) => {
        if (validate(emailObject)) {
          successArray.push(emailObject);
        } else {
          failArray.push(Object.assign(emailObject, { error: ajv.errorsText(validate.errors) }));
        }
        return true;
      });
      res.locals.successArray = successArray;
      res.locals.failArray = failArray;
      next();
    } else {
      const error = new Error();
      error.status = 400;
      error.body = { error: 'Email subject must be provided' };
      next(error);
    }
  } else {
    const error = new Error();
    error.status = 400;
    error.body = { error: 'Emails must be provided as an array' };
    next(error);
  }
}

/**
 * This function checks if the current user has the permissions required to access the function
 * @param {Number} level The level of access [1,4] that the function needs
 * @return {Function}
 */
function verifyACL(level) {
  return function (req, res, next) {
    if (res.locals.privilege) {
      if (res.locals.privilege >= level) {
        next();
      } else {
        const error = new Error();
        error.status = 401;
        error.body = { error: 'You do not have sufficient permissions for this operation' };
        next(error);
      }
    } else {
      const error = new Error();
      error.status = 500;
      error.body = { error: 'Something went wrong while accessing permissions' };
      next(error);
    }
  };
}


/** ********************** ROUTES ******************************** */

router.get('/', (req, res) => {
  res.status(200).send({ response: 'authorized' });
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
  if ((!req.query.limit || parseInt(req.query.limit, 10)) && (!req.query.offset || parseInt(req.query.offset, 10))) {
    Registration.getAll(req.uow, {
      count: parseInt(req.query.limit, 10),
      limit: parseInt(req.query.offset, 10),
    }).then((stream) => {
      res.status(200).type('application/json');
      stream
        .pipe(transform(
          100,
          { objectMode: true, ordered: false },
          (data, callback) => {
            authenticator.getUserData(data.uid)
              .then((user) => {
                data.sign_up_time = new Date(user.metadata.creationTime).getTime();
                callback(null, data);
              }).catch(() => {
              res.status(207);
              callback(null, data);
            });
          },
        )).on('error', (err) => {
        const error = new Error();
        error.status = 500;
        error.body = err.message;
        next(error);
      })
        .pipe(Stringify())
        .pipe(res)
        .on('end', () => {
          res.end();
        });
      stream.on('error', (err) => {
        const error = new Error();
        error.status = 500;
        error.body = err.message;
        next(error);
      });
    }).catch((err) => {
      const error = new Error();
      error.status = 500;
      error.body = err.message;
      next(error);
    });
  } else {
    const error = new Error();
    error.status = 400;
    error.body = { message: 'Limit and offset must be integers' };
    next(error);
  }
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
  if ((!req.query.limit || parseInt(req.query.limit, 10)) && (!req.query.offset || parseInt(req.query.offset, 10))) {
    PreRegistration.getAll(req.uow, {
      count: parseInt(req.query.limit, 10),
      limit: parseInt(req.query.offset, 10),
    }).then((stream) => {
      stream
        .pipe(Stringify())
        .pipe(res.type('json').status(200))
        .on('error', (err) => {
          const error = new Error();
          error.status = 500;
          error.body = err.message;
          next(error);
        }).on('end', res.end); // TODO: Make this the standard whenever piping to res
    }).catch((err) => {
      const error = new Error();
      error.status = 500;
      error.body = err.message;
      next(error);
    });
    /*
      stream.pipe(res);
      stream.on('end', () => res.status(200).send());
      stream.on('err', (err) => {
        const error = new Error();
        error.status = 500;
        error.body = err.message;
        next(error);
      });

    // database.getPreRegistrations(parseInt(req.query.limit), parseInt(req.query.offset))
    //   .on('data', (document) => {
    //     arr.push(document);
    //   }).on('err', (err) => {
    //   const error = new Error();
    //   error.status = 500;
    //   error.body = err.message;
    //   next(error);
    // }).on('end', () => {
    //   res.status(200).send(arr);
    // }); */
  } else {
    const error = new Error();
    error.status = 400;
    error.body = { message: 'Limit must be an integer' };
    next(error);
  }
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
  if (!(req.query && req.query.email && validator.validate(req.query.email))) {
    const error = new Error();
    error.status = 400;
    error.body = { error: 'request query must be set and a valid email' };
    next(error);
  } else {
    authenticator.getUserId(req.query.email).then((user) => {
      res.status(200).send({ uid: user.uid, displayName: user.displayName });
    }).catch((error) => {
      const err = new Error();
      console.error(error);
      err.status = error.status || 500;
      err.body = error.message;
      next(err);
    });
  }
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
  if ((!req.query.limit || parseInt(req.query.limit, 10)) && (!req.query.offset || parseInt(req.query.offset, 10))) {
    RSVP.getAll(req.uow, {
      count: parseInt(req.query.limit, 10),
      limit: parseInt(req.query.offset, 10),
    }).then((stream) =>
     {
      stream.pipe(Stringify()).pipe(res);
      stream.on('end', () => res.status(200).send());
      stream.on('err', (err) => {
        const error = new Error();
        error.status = 500;
        error.body = err.message;
        next(error);
      });
    });
    // database.getRSVPList(parseInt(req.query.limit), parseInt(req.query.offset))
    //   .on('data', (document) => {
    //     arr.push(document);
    //   }).on('end', () => {
    //   res.status(200).send(arr);
    // });
  } else {
    const error = new Error();
    error.status = 400;
    error.body = { message: 'Limit or offset must be an integer' };
    next(error);
  }
});

/**
 * @api {post} /admin/update_registration Update an existing registration
 * @apiVersion 0.3.3
 * @apiName Update Registration
 * @apiGroup Admin
 * @apiPermission Exec
 *
 * @apiUse AuthArgumentRequired
 */
router.post('/update_registration', verifyACL(3), (req, res, next) => {
  if (req.body && req.body.registration) {
    const updatedRegistration = new Registration(req.body.registration, req.uow);
    if (updatedRegistration.mlh_coc && updatedRegistration.mlh_dcp && updatedRegistration.eighteenBeforeEvent) {
      updatedRegistration
        .update(req.body.registration.uid, 'uid')
        .then(() => res.status(200).send({ status: 'Success' }))
        .catch((err) => {
          const error = new Error();
          error.status = 400;
          error.body = err.message;
          next(error);
        });
    } else {
      const error = new Error();
      error.status = 400;
      error.body = { message: 'Must agree to MLH terms and be over eighteen' };
      next(error);
    }
  } else {
    const error = new Error();
    error.status = 400;
    error.body = { message: 'Updated registration data must be provided' };
    next(error);
  }
});

/**
 * @api {get} /admin/get_attendance_list retrieve the list of people who attended
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
    .then((stream) => {
      stream.pipe(res);
      stream.on('end', () => res.status(200).send());
      stream.on('err', (err) => {
        const error = new Error();
        error.status = 500;
        error.body = err.message;
        next(error);
      });
    });
  // database.getAttendanceList()
  //   .on('data', (document) => {
  //     arr.push(document);
  //   }).on('err', (err) => {
  //   const error = new Error();
  //   error.status = 500;
  //   error.body = err.message;
  //   next(error);
  // }).on('end', () => {
  //   res.status(200).send(arr);
  // });
});

// /**
//  * @api {get} /admin/rsvp_attendance retrieve the list of people who attended
//  * @apiVersion 0.3.2
//  * @apiName Retrieve Attendance List based on RSVPs
//  * @apiGroup Admin
//  * @apiPermission Exec
//  *
//  * @apiUse AuthArgumentRequired
//  * @apiSuccess {Array} Array of hackers who attended
//  */
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
  if (req.body && req.body.uid) {
    const privilege = (req.body.privilege && parseInt(req.body.privilege, 10)) || 1;
    if ((res.locals.privilege < 4) && privilege < res.locals.privilege) { // If not tech-exec and attempting to reduce permissions
      const error = new Error();
      error.status = 400;
      error.body = { message: 'You cannot reduce privileges' };
      next(error);
    } else {
      authenticator.elevate(req.body.uid, privilege)
        .then(() => {
          res.status(200).send({ status: 'Success' });
        })
        .catch((err) => {
          const error = new Error();
          error.status = 500;
          error.body = err.message;
          next(error);
        });
    }
  } else {
    const error = new Error();
    error.status = 400;
    error.body = { error: 'UID must be provided' };
    next(error);
  }
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
    .then((stream) => {
      stream
        .pipe(Stringify())
        .pipe(res.type('json').status(200))
        .on('error', (err) => {
          const error = new Error();
          error.status = 500;
          error.body = err.message;
          next(error);
        }).on('end', res.end); // TODO: Make this the standard whenever piping to res
    });
});
/*
router.get('/location_list', verifyACL(3), (req, res, next) => {
  Location.getAll()
    .then((stream) => {
      stream.pipe(res);
      stream.on('end', () => res.status(200).send());
      stream.on('err', (err) => {
        const error = new Error();
        error.status = 500;
        error.body = err.message;
        next(error);
      });
    });

  // database.getAllLocations().on('data', (document) => {
  //   arr.push(document);
  // }).on('err', (err) => {
  //   const error = new Error();
  //   error.status = 500;
  //   error.body = err.message;
  //   next(error);
  // }).on('end', () => {
  //   res.status(200).send(arr);
  // });
});
*/



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
 /*
router.post('/create_location', verifyACL(2), (req, res, next) => {
  if (req.body && req.body.locationName && (req.body.locationName.length > 0)) {
    const location = new Location({ location_name: req.body.locationName }, req.uow);
    console.log('if:' + req.body.locationName);
    location.add()
      .then((stream) => {
        stream
          .pipe(Stringify())
          .pipe(res.type('json').status(200))
          .on('error', (err) => {
            const error = new Error();
            error.status = 500;
            error.body = err.message;
            next(error);
          }).on('end', res.end); // TODO: Make this the standard whenever piping to res
      });
  } else {
      console.log('else:' + req.body.locationName);
      const error = new Error();
      error.status = 400;
      error.body = 'Require a name for the location';
      next(error);
  }
});
*/

router.post('/create_location', verifyACL(3), (req, res, next) => {
  if (req.body && req.body.locationName && (req.body.locationName.length > 0)) {
    const location = new Location({ location_name: req.body.locationName }, req.uow);
    location.add()
      .then(() => {
        res.status(200).send({ status: 'Success' });
      }).catch((err) => {
      const error = new Error();
      error.status = 500;
      error.body = err.message;
      next(error);
    });
    // database.addNewLocation(req.body.locationName).then(() => {
    // }).catch((err) => {
    //
    // });
  } else {
    const error = new Error();
    error.status = 400;
    error.body = 'Require a name for the location';
    next(error);
  }
});



/**
 * @api {post} /admin/update_location Update name of the location associated with the uid in the database
 * @apiVersion 0.2.3
 * @apiName Update Location
 * @apiGroup Admin
 * @apiPermission Exec
 *
 * @apiParam {String} uid - the uid that is having the name of the location associated with this id changed
 * @apiParam {String} name - the new name that is being updated with the name associated with the uid
 * @apiUse AuthArgumentRequired
 * @apiSuccess {String} Success
 * @apiUse IllegalArgumentError
 */

router.post('/update_location', verifyACL(3), (req, res, next) => {
  if (
    req.body &&
    req.body.uid &&
    req.body.location_name &&
    req.body.location_name.length > 0 &&
    (req.body.uid.length > 0)) {

    const location = new Location({ uid: req.body.uid, location_name: req.body.location_name }, req.uow);
    location.update(req.body.uid, 'uid')
      .then(() => {
        res.status(200).send({ status: 'Success' });
      }).catch((err) => {
      const error = new Error();
      error.status = 500;
      error.body = err.message;
      next(error);
    });
    // database.updateLocation(req.body.uid, req.body.name)
    //   .then(() => {
    //     res.status(200).send({ status: 'Success' });
    //   }).catch((err) => {
    //     const error = new Error();
    //     error.status = 500;
    //     error.body = err.message;
    //     next(error);
    //   });
  } else {
    const error = new Error();
    error.status = 400;
    error.body = 'Require the uid and/or name for the location';
    next(error);
  }
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
  if (req.body && req.body.uid && (req.body.uid.length > 0)) {
    const location = new Location({ uid: req.body.uid }, req.uow);
    location.delete(req.body.uid)
      .then(() => {
        res.status(200).send({ status: 'Success' });
      }).catch((err) => {
      const error = new Error();
      error.status = 500;
      error.body = err.message;
      next(error);
    });
    // database.removeLocation(req.body.uid)
    //   .then(() => {
    //     res.status(200).send({ status: 'Success' });
    //   }).catch((err) => {
    //     const error = new Error();
    //     error.status = 500;
    //     error.body = err.message;
    //     next(error);
    //   });
  } else {
    const error = new Error();
    error.status = 400;
    error.body = 'Require the uid for the location';
    next(error);
  }
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
    .then((stream) => {
      stream
        .pipe(Stringify())
        .pipe(res.type('json').status(200))
        .on('error', (err) => {
          const error = new Error();
          error.status = 500;
          error.body = err.message;
          next(error);
        }).on('end', res.end); // TODO: Make this the standard whenever piping to res
    });
});
/*
router.get('/extra_credit_list', verifyACL(3), (req, res, next) => {
  database.getExtraCreditClassList(req.uow)
    .pipe(Stringify())
    .pipe(res)
    .on('error', (err) => {
      const error = new Error();
      error.status = 500;
      error.body = err.message;
      next(error);
    })
    .on('end', () => {
      res.status(200).send();
    });
});
*/
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
  if (req.body && req.body.uid && req.body.cid && parseInt(req.body.cid, 10)) {
    database.assignExtraCredit(req.uow, req.body.uid, req.body.cid)
      .then(() => {
        res.status(200).send({ status: 'Success' });
      }).catch((err) => {
      const error = new Error();
      error.status = 500;
      error.body = err.message;
      next(error);
    });
  } else {
    const error = new Error();
    error.status = 400;
    error.body = 'Need a proper id for the class or the hacker (int)';
    next(error);
  }
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
  if (res.locals.successArray && res.locals.successArray.length > 0) {
    if (req.body.subject && typeof req.body.subject === 'string') {
      const promises = [];
      // All valid input
      // Send all the emails
      res.locals.successArray.forEach((emailObject) => { // For each emailObject
        promises.push(new Promise((resolve) => {
          // Substitute HTML with name/emails and send email
          functions.emailSubstitute(req.body.html, emailObject.name, emailObject.substitutions).then((subbedHTML) => {
            const request = functions.createEmailRequest(emailObject.email, subbedHTML, req.body.subject, req.body.fromEmail); // Generate the POST request
            functions.sendEmail(request.data)
              .then(() => {
                resolve({ email: request.data.to, response: 'success', name: emailObject.name }); // If successful, resolve
              }).catch((error) => {
              res.locals.failArray.push(Object.assign(emailObject, error)); // Else add to the failArray for the partial HTTP success response
              resolve(null);
            });
          }).catch((error) => {
            res.locals.failArray.push(Object.assign(emailObject, error)); // if email substitution fails, add to fail array for partial HTTP success response
            resolve(null);
          });
        }));
      });
      Promise.all(promises).then((resolution) => {
        const resolves = resolution.filter(result => result !== null);
        if (resolves.length === 0) {
          const error = new Error();
          error.status = 500;
          error.body = {
            text: 'Emails could not be sent',
            error: res.locals.failArray,
          };
          next(error);
        } else if (res.locals.failArray.length > 0) {
          database.addEmailsHistory(req.uow, resolves.map(resolution => ({
            sender: res.locals.user.uid,
            recipient: resolution.email,
            email_content: req.body.html,
            subject: req.body.subject,
            recipient_name: resolution.name,
            time: new Date().getTime(),
          })), res.locals.failArray ? res.locals.failArray.map(errorEmail => ({
            sender: res.locals.user.uid,
            recipient: errorEmail.email || null,
            email_content: req.body.html || null,
            subject: req.body.subject || null,
            recipient_name: errorEmail.name || null,
            time: new Date().getTime(),
          })) : null).catch(err => console.error(err));
          res.status(207).send(res.locals.failArray.concat(resolves)); // Partial success response
        } else {
          res.status(200).send(resolves); // Full success response
        }
      }).catch(err => console.error(err));
    } else {
      const error = new Error();
      error.status = 400;
      error.body = { error: 'Email subject must be provided' };
      next(error);
    }
  } else {
    const error = new Error();
    error.status = 400;
    error.body = {
      text: 'All provided emails had illegal format',
      error: res.locals.failArray,
    };
    next(error);
  }
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
    .then((stream) => {
      stream
        .pipe(Stringify())
        .pipe(res.type('json').status(200))
        .on('error', (err) => {
          const error = new Error();
          error.status = 500;
          error.body = err.message;
          next(error);
        }).on('end', res.end); // TODO: Make this the standard whenever piping to res
    });
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
    .then((stream) => {
      stream
        .pipe(Stringify())
        .pipe(res.type('json').status(200))
        .on('error', (err) => {
          const error = new Error();
          error.status = 500;
          error.body = err.message;
          next(error);
        }).on('end', res.end); // TODO: Make this the standard whenever piping to res
    });
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
    .then((stream) => {
      stream
        .pipe(Stringify())
        .pipe(res.type('json').status(200))
        .on('error', (err) => {
          const error = new Error();
          error.status = 500;
          error.body = err.message;
          next(error);
        }).on('end', res.end); // TODO: Make this the standard whenever piping to res
    });
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
    .then((stream) => {
      stream
        .pipe(Stringify())
        .pipe(res.type('json').status(200))
        .on('error', (err) => {
          const error = new Error();
          error.status = 500;
          error.body = err.message;
          next(error);
        }).on('end', res.end); // TODO: Make this the standard whenever piping to res
    });
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
    .then((stream) => {
      stream
        .pipe(Stringify())
        .pipe(res.type('json').status(200))
        .on('error', (err) => {
          const error = new Error();
          error.status = 500;
          error.body = err.message;
          next(error);
        }).on('end', res.end); // TODO: Make this the standard whenever piping to res
    });
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
router.get('/statistics', verifyACL(2), (req, res, next) => {
  Registration.getStatsCount(req.uow)
    .then((stream) => {
      stream
        .pipe(Stringify())
        .pipe(res.type('json').status(200))
        .on('error', (err) => {
          const error = new Error();
          error.status = 500;
          error.body = err.message;
          next(error);
        }).on('end', res.end); // TODO: Make this the standard whenever piping to res
    });
});

module.exports = router;

