/* eslint-disable max-len */
const constants = require('../helpers/constants');
const functions = require('../helpers/functions');
const validator = require('email-validator');

const admin = require('firebase-admin');
const express = require('express');
const authenticator = require('../helpers/auth');
const database = require('../helpers/database');
const Ajv = require('ajv');

const ajv = new Ajv({allErrors: true});


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
          error.body = {error: 'You do not have sufficient permissions for this operation'};
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
    error.body = {error: 'ID Token must be provided'};
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
      const validate = ajv.compile(constants.emailObjectSchema);
      const successArray = [];
      const failArray = [];
      req.body.emails.map((emailObject) => {
        if (validate(emailObject)) {
          successArray.push(emailObject);
        } else {
          failArray.push(Object.assign(emailObject, {error: ajv.errorsText(validate.errors)}));
        }
        return true;
      });
      res.locals.successArray = successArray;
      res.locals.failArray = failArray;
      next();
    } else {
      const error = new Error();
      error.status = 400;
      error.body = {error: 'Email subject must be provided'};
      next(error);
    }
  } else {
    const error = new Error();
    error.status = 400;
    error.body = {error: 'Emails must be provided as an array'};
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
        error.body = {error: 'You do not have sufficient permissions for this operation'};
        next(error);
      }
    } else {
      const error = new Error();
      error.status = 500;
      error.body = {error: 'Something went wrong while accessing permissions'};
      next(error);
    }
  };
}


/** ********************** ROUTES ******************************** */

router.get("/", (req, res, next) => {
  res.status(200).send({"response": "authorized"});
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
  if ((!req.query.limit || parseInt(req.query.limit)) && (!req.query.offset || parseInt(req.query.offset))) {
    let arr = [];
    database.getRegistrations(parseInt(req.query.limit), parseInt(req.query.offset))
      .on('data', (document) => {
        arr.push(document);
      }).on('err', (err) => {
      const error = new Error();
      error.status = 500;
      error.body = err.message;
      next(error);
    }).on('end', () => {
      Promise.all(arr.map((value) => {
        return new Promise((resolve, reject) => {
          authenticator.getUserData(value.uid)
            .then((user) => {
              value.sign_up_time = new Date(user.metadata.creationTime).getTime();
              resolve(value);
            }).catch(err => reject(err));
        })
      })).then(result => res.status(200).send(result))
        .catch((err) => {
          res.status(207).send(arr);
        });
    })
  } else {
    const error = new Error();
    error.status = 400;
    error.body = {"message": "Limit and offset must be integers"};
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
  if ((!req.query.limit || parseInt(req.query.limit)) && (!req.query.offset || parseInt(req.query.offset))) {
    let arr = [];
    database.getPreRegistrations(parseInt(req.query.limit), parseInt(req.query.offset))
      .on('data', (document) => {
        arr.push(document);
      }).on('err', (err) => {
      const error = new Error();
      error.status = 500;
      error.body = err.message;
      next(error);
    }).on('end', () => {
      res.status(200).send(arr);
    })
  } else {
    const error = new Error();
    error.status = 400;
    error.body = {"message": "Limit must be an integer"};
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
    error.body = {error: "request query must be set and a valid email"};
    next(error);
  } else {
    authenticator.getUserId(req.query.email).then((user) => {
      res.status(200).send({uid: user.uid, displayName: user.displayName});
    }).catch((error) => {
      const err = new Error();
      console.error(error);
      err.status = error.status || 500;
      err.body = error.message;
      next(err);
    })
  }
});

/**
 * @api {get} /admin/rsvp_list Get list of people who rsvp
 * @apiVersion 0.1.0
 * @apiName Retrive RSVP list
 * @apiGroup Admin
 * @apiPermission Exef

 * @apiParam {Number} limit=Math.inf Limit to a certain number of responses
 * @apiParam {Number} offset=0 The offset to start retrieving users from. Useful for pagination
 *
 * @apiUse AuthArgumentRequired
 *
 * @apiSuccess {Array} Array of hackers who RSVP
 */
router.get('/rsvp_list', verifyACL(3), (req, res, next) => {
    if ((!req.query.limit || parseInt(req.query.limit)) && (!req.query.offset || parseInt(req.query.offset))) {
        let arr = [];
        database.getRSVPList(parseInt(req.query.limit),parseInt(req.query.offset))
            .on('data', (document) => {
                arr.push(document);
            }).on('error', (err) => {
                const error = new Error();
                error.status = 500;
                error.body = err.message;
                next(error);
            }).on('end', () => {
                res.status(200).send(arr);
            })
    } else {
        const error = new Error();
        error.status = 400;
        error.body = {"message": "Limit or offset must be an integer"};
        next(error);
    }
});



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
    authenticator.elevate(req.body.uid, req.body.privilege ? req.body.privilege : 1)
      .then(() => {
        res.status(200).send('Success');
      })
      .catch((err) => {
        const error = new Error();
        error.status = 500;
        error.body = err.message;
        next(error);
      });
  } else {
    const error = new Error();
    error.status = 400;
    error.body = {error: 'UID must be provided'};
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
                resolve({ email: request.data.to, response: 'success', name: emailObject.name}); // If successful, resolve
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
        } else {
          if (res.locals.failArray.length > 0) {
            database.addEmailsHistory(resolves.map((resolution) => {
              return {
                sender: res.locals.user.uid,
                recipient: resolution.email,
                email_content: req.body.html,
                subject: req.body.subject,
                recipient_name: resolution.name,
                time: new Date().getTime(),
              }
            }), res.locals.failArray ? res.locals.failArray.map((errorEmail) => {
              return {
                sender: res.locals.user.uid,
                recipient: errorEmail.email || null,
                email_content: req.body.html || null,
                subject: req.body.subject || null,
                recipient_name: errorEmail.name || null,
                time: new Date().getTime(),
              }
            }) : null).catch(err => console.error(err));
            res.status(207).send(res.locals.failArray.concat(resolves)); // Partial success response
          } else {
            res.status(200).send(resolves); // Full success response
          }
        }
      }).catch(err => console.error(err));
    } else {
      const error = new Error();
      error.status = 400;
      error.body = {error: 'Email subject must be provided'};
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


module.exports = router;

