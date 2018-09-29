/* eslint-disable consistent-return,no-use-before-define,no-param-reassign,no-new */
const express = require('express');
const Ajv = require('ajv');
const _ = require('lodash');
const validator = require('email-validator');
const {
  errorHandler500,
  emailSubstitute,
  createEmailRequest,
  sendEmail,
  streamHandler,
  standardErrorHandler,
} = require('../services/functions');
const authenticator = require('../services/auth');
const { logger } = require('../services/logging');
const constants = require('../assets/constants/constants');
const { Registration } = require('../models/Registration');
const { Project } = require('../models/Project');
const { RSVP } = require('../models/RSVP');
const { Category } = require('../models/Category');
const { ActiveHackathon } = require('../models/ActiveHackathon');
const HttpError = require('../JSCommon/HttpError');
const travelReimbursement = require('./travel_reimbursement');
const { projectRegistrationSchema } = require('../assets/schemas/load-schemas')(['projectRegistrationSchema']);

// const storage = new StorageService(STORAGE_TYPES.S3);
const router = express.Router();

const ajv = new Ajv({ allErrors: true });

/** *********** HELPER FUNCTIONS ************* */

function validateProjectRegistration(project) {
  const validate = ajv.compile(projectRegistrationSchema);
  if (process.env.APP_ENV === 'test') {
    validate(project);
    logger.error(validate.errors);
  }
  return !!validate(project);
}


/** *********** HELPER MIDDLEWARE ***************** */

router.use(['/reimbursement', '/travelReimbursement'], travelReimbursement);

/**
 * User authentication middleware
 */
router.use((req, res, next) => {
  if (process.env.APP_ENV === 'debug') {
    return next();
  }
  if (!req.headers.idtoken) {
    const error = new Error();
    error.status = 401;
    error.body = { error: 'ID Token must be provided' };
    return next(error);
  }
  return authenticator.checkAuthentication(req.headers.idtoken)
    .then((decodedToken) => {
      res.locals.user = decodedToken;
      res.locals.uid = decodedToken.uid;
      return next();
    })
    .catch((err) => {
      const error = new Error();
      error.status = 401;
      error.body = err.message;
      return next(error);
    });
});


/** *********** ROUTING MIDDLEWARE *********** */
/**
 * @api {get} /users Get the privilege information for the current user
 * @apiVersion 1.0.0
 * @apiName Get user privilege information
 * @apiGroup Users
 * @apiPermission UserPermission
 *
 * @apiUse AuthArgumentRequired
 *
 * @apiSuccess {Object} JSON Object with user's data
 */
router.get('/', (req, res, next) => {
  if (!res.locals.user) {
    const error = new Error();
    error.status = 500;
    error.body = { error: 'Could not retrieve user information' };
    return next(error);
  }
  res.status(200)
    .send({
      admin: res.locals.user.admin,
      privilege: res.locals.user.privilege,
    });
});

/**
 * @api {get} /users/registration Get the most current registration information for the current user
 * @apiVersion 1.0.0
 * @apiName Get user registration information
 * @apiGroup Registration
 * @apiPermission UserPermission
 *
 * @apiUse AuthArgumentRequired
 *
 * @apiSuccess {Object} JSON Object with user's data
 */
router.get('/registration', (req, res, next) => {
  if (!res.locals.user) {
    const error = new Error();
    error.status = 500;
    error.body = { error: 'Could not retrieve user information' };
    return next(error);
  }
  new Registration({ uid: res.locals.user.uid }, req.uow)
    .get()
    .then((registrationArray) => {
      const [registration] = registrationArray;
      res.status(200).send(registration);
    })
    .catch(err => errorHandler500(err, next));
});

/**
 * @api {get} /users/project Get the project details and table assignment for the current user
 * @apiVersion 1.0.0
 * @apiName Get user project data
 * @apiGroup Project
 * @apiPermission UserPermission
 *
 * @apiUse AuthArgumentRequired
 *
 * @apiSuccess {Object} JSON Object with user's table assignment data
 */
router.get('/project', (req, res, next) => {
  if (!res.locals.user) {
    const error = new Error();
    error.status = 500;
    error.body = { error: 'Could not retrieve user information' };
    return next(error);
  }
  const info = [];
  Project.getByUser(res.locals.user.uid, req.uow)
    .then((stream) => {
      stream
        .on('data', (data) => {
          info.push(data);
        })
        .on('err', err => errorHandler500(err, next))
        .on('end', () => {
          // Reduce the large number of responses that differ by
          // category name and id into a json array internally instead
          const response = info.reduce((accumulator, currentVal) => {
            Object.keys(currentVal)
              .forEach((k) => {
                if (k !== 'categoryName' && k !== 'categoryID') { // If the field is going to be the same
                  accumulator[k] = currentVal[k];
                } else if (accumulator[k]) { // Else accumulate it in an array
                  accumulator[k].push(currentVal[k]);
                } else {
                  accumulator[k] = [currentVal[k]];
                }
              });
            return accumulator;
          }, {});
          res.status(200)
            .send(response);
        });
    }).catch(err => errorHandler500(err, next));
});

/**
 * @api {post} /users/rsvp confirm the RSVP status for the current user and send a email containing their pin
 * @apiVersion 1.0.0
 * @apiName Set RSVP
 *
 * @apiGroup RSVP
 * @apiPermission UserPermission
 *
 * @apiParam {String} A value to indicate if the user decide to rsvp ['true', 'false']
 *
 * @apiUse AuthArgumentRequired
 * @apiSuccess sends a email with user's pin
 * @apiUse IllegalArgumentError
 */
router.post('/rsvp', (req, res, next) => {
  // Validations.
  if (!req.body || typeof req.body.rsvp === 'undefined') {
    const error = new Error();
    error.status = 400;
    error.body = { error: 'RSVP value must be included' };
    return next(error);
  }
  if (!res.locals.user) {
    const error = new Error();
    error.status = 400;
    error.body = { error: 'Could not identify user' };
    logger.error(error);
    return next(error);
  }
  // RSVP login starts here
  const rsvp = new RSVP(
    {
      userUID: res.locals.user.uid,
      rsvp_status: req.body.rsvp === 'true',
    },
    req.uow,
  );
  let email = null;
  let pin = null;
  rsvp.add()
    .then(() => {
      // Retrieve registration.
      if (req.body.rsvp === 'true') {
        return new Registration({ uid: res.locals.user.uid }, req.uow).get()
          .then((registrationArray) => {
            const [user] = registrationArray;
            email = user.email || '';
            const name = user.firstname;
            pin = user.pin || 78;
            return emailSubstitute(constants.RSVPEmailHtml.text, name, {
              name,
              pin: _.padStart(pin.toString(), 4, '0'),
            });
          })
          .then((subbedHTML) => {
            const request = createEmailRequest(email, subbedHTML, constants.RSVPEmailHtml.subject, '');
            return sendEmail(request);
          })
          .then(() => {
            res.status(200)
              .send({
                message: 'success',
                pin: _.padStart(pin.toString(), 4, '0'),
              });
          })
          .catch(err => errorHandler500(err, next));
      }
      return res.status(200)
        .send({ message: 'success' });
    })
    .catch((err) => {
      if (err instanceof HttpError) {
        return next(err);
      }
      return errorHandler500(err, next);
    });
});


/**
 * @api {get} /users/rsvp Get the RSVP status for a user
 * @apiVersion 1.0.0
 * @apiName get RSVP status
 *
 * @apiGroup RSVP
 * @apiPermission UserPermission
 *
 * @apiUse AuthArgumentRequired
 * @apiSuccess {Object} Containing the rsvp status based on the uid
 * @apiUse IllegalArgumentError
 */
router.get('/rsvp', (req, res, next) => {
  if (!res.locals.user) {
    const error = new Error();
    error.status = 400;
    error.body = { error: 'Could not identify user' };
    return next(error);
  }
  RSVP.rsvpStatus(res.locals.user.uid, req.uow)
    .then((statusArray) => {
      const [status] = statusArray;
      res.status(200).send(status);
    })
    .catch(err => errorHandler500(err, next));
});


/**
 * @api {post} /users/project Post the project details to get the table assignment
 * @apiVersion 1.0.0
 * @apiName Post user project data
 * @apiGroup Project
 * @apiPermission UserPermission
 * @apiParam {String} projectName Name of the project
 * @apiParam {Array} team Array of team emails
 * @apiParam {Array} categories Array of category IDs the project is submitting for

 * @apiUse AuthArgumentRequired
 *
 * @apiSuccess {Object} JSON Object with user's project ID
 */
router.post('/project', (req, res, next) => {
  /*
  1) insert project
  2) insert members
  3) insert project categories
  4) get project id
   */
  if (!res.locals.user) {
    const error = new Error();
    error.body = { error: 'Could not find user' };
    error.status = 400;
    return next(error);
  }
  const project = new Project(req.body, req.uow);
  if (project.validate().error || !project.team.map(validator.validate).every(value => value)) {
    const error = new Error();
    error.status = 400;
    error.body = {
      result: 'Some properties were not as expected. Make sure you provide a list of team members and categories',
      validation: project.validate().error,
    };
    return next(error);
  }
  // Valid project
  const uidPromises = req.body.team.map(email => authenticator.getUserId(email));
  Promise.all(uidPromises)
    .catch((err) => {
      const error = new Error();
      error.status = 400;
      error.body = {
        result: 'Some emails were not associated with an account. Please check your input and try again.',
        info: err.message,
      };
      next(error);
    })
    .then((records) => {
      const uids = new Set(records.map(r => r.uid));
      // uids contains an array of uids
      uids.add(res.locals.user.uid);
      logger.info(Array.from(uids));
      const { categories } = req.body;
      if (!categories ||
        !Array.isArray(categories) ||
        categories.length === 0 || // TODO: Check that this is valid behavior
        categories.length !== categories.filter(value => value.toString().match(/\d+/)).length) {
        const error = new Error();
        error.body = { result: 'Some categories were not valid. Check and try again' };
        error.status = 400;
        return next(error);
      }
      // Categories array is valid
      project.team = Array.from(uids);
      project.categories = categories;
      return project.add();
    })
    .catch((err) => {
      switch (err.errno) {
        case 1452:
          // Registration could not be found.
          err.status = 404;
          err.message = 'Registration could not be found';
          break;
        case 1644:
          // Already submitted
          err.status = 400;
          err.message = 'Submission already exists';
          break;
        default:
          break;
      }
      throw err;
    })
    .then((result) => {
      if (process.env.APP_ENV === 'debug') {
        logger.debug(result);
      }
      project.projectId = result[1][0].projectID;
      // Project ID returned here.
      // Assign a table now
      return project.assignTable();
    })
    .then(result => res.status(200).send(result[1][0]))
    .catch(err => standardErrorHandler(err, next));
});

/**
 * @api {get} /users/event/categories Get all the event categories
 * @apiName Get Event Categories
 * @apiVersion 1.0.0
 * @apiGroup Events
 * @apiPermission UserPermission
 *
 * @apiUse AuthArgumentRequired
 * @apiSuccess {Array} Categories
 */
router.get('/event/categories', (req, res, next) => {
  Category.getAll(req.uow)
    .then(stream => streamHandler(stream, res, next))
    .catch(err => errorHandler500(err, next));
});

/**
 * @api {get} /users/hackathon/active Get the uid, name, and pin base of the active hackathon
 * @apiVersion 1.0.0
 * @apiName Get Active Hackathon
 * @apiGroup Hackathon
 * @apiPermission UserPermission
 *
 * @apiUse AuthArgumentRequired
 *
 * @apiSuccess {Array} Array containing name of active hackathon
 */
router.get('/hackathon/active', (req, res, next) => {
  ActiveHackathon.get(req.uow)
    .then((data) => {
      res.type('json').status(200).send(data[0]);
    })
    .catch(err => errorHandler500(err, next));
});

module.exports = router;
