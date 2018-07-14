/* eslint-disable consistent-return,no-use-before-define,no-param-reassign,no-new */
const express = require('express');
const path = require('path');
const Ajv = require('ajv');
const _ = require('lodash');
const validator = require('email-validator');
const {
  errorHandler500, emailSubstitute, createEmailRequest, sendEmail, streamHandler,
} = require('../services/functions');
const authenticator = require('../services/auth');
const StorageService = require('../services/storage_service');
const { STORAGE_TYPES, StorageFactory } = require('../services/factories/storage_factory');
const constants = require('../assets/constants/constants');
const { projectRegistrationSchema, travelReimbursementSchema } =
  require('../assets/schemas/load-schemas')(['projectRegistrationSchema', 'travelReimbursementSchema']);
const TravelReimbursement = require('../models/TravelReimbursement');
const { Registration } = require('../models/Registration');
const { Hackathon } = require('../models/Hackathon');
const { Project } = require('../models/Project');
const { RSVP } = require('../models/RSVP');
const { Category } = require('../models/Category');

const storage = new StorageService(STORAGE_TYPES.S3);
const router = express.Router();


const ajv = new Ajv({ allErrors: true });

const upload = storage.upload({
  storage: StorageFactory.GCStorage({
    bucket: constants.GCS.travelReimbursementBucket,
    metadata(req, file, cb) {
      cb(null, {
        fieldName: file.fieldname,
      });
    },
    key(req, file, cb) {
      cb(null, generateFileName(req.body.fullName, file));
    },
  }),
  fileFilter(req, file, cb) {
    if (path.extname(file.originalname) !== '.jpeg' &&
      path.extname(file.originalname) !== '.png' &&
      path.extname(file.originalname) !== '.jpg') {
      return cb(new Error('Only jpeg, jpg, and png are allowed'));
    }
    cb(null, true);
  },
  limits: { fileSize: 1024 * 1024 * 5 }, // limit to 5MB
});

/** *********** HELPER FUNCTIONS ************* */

function validateProjectRegistration(project) {
  const validate = ajv.compile(projectRegistrationSchema);
  if (process.env.APP_ENV === 'test') {
    validate(project);
    console.error(validate.errors);
  }
  return !!validate(project);
}

/**
 *
 * @param data
 */
function validateReimbursement(data) {
  const validate = ajv.compile(travelReimbursementSchema);
  const result = !!validate(data);
  console.error(validate.errors);
  return result;
}

/**
 *
 * @param price {Number}
 * @param groupMembers {String}
 */
function adjustReimbursementPrice(price, groupMembers) {
  if ((groupMembers === '1' || groupMembers === '0') && price > 50) {
    return 50;
  } else if (groupMembers === '2' && price > 60) {
    return 60;
  } else if (groupMembers === '3' && price > 70) {
    return 70;
  } else if (price > 70) {
    return 70;
  }

  return price;
}

/**
 *
 * @param fullName
 * @param file
 * @returns {string}
 */
function generateFileName(fullName, file) {
  return `${fullName}-receipt-${file.originalname}`;
}

/** *********** HELPER MIDDLEWARE ***************** */
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
  authenticator.checkAuthentication(req.headers.idtoken)
    .then((decodedToken) => {
      res.locals.user = decodedToken;
      res.locals.uid = decodedToken.uid;
      next();
    })
    .catch((err) => {
      const error = new Error();
      error.status = 401;
      error.body = err.message;
      next(error);
    });
});


/** *********** ROUTING MIDDLEWARE *********** */
/**
 * @api {get} /users Get the privilege information for the current user
 * @apiVersion 0.1.2
 * @apiName Get user privilege information
 * @apiGroup Users
 * @apiPermission User
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
 * @apiVersion 0.2.1
 * @apiName Get user registration information
 * @apiGroup Users
 * @apiPermission User
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
 * @apiVersion 0.4.0
 * @apiName Get user project data
 * @apiGroup Users
 * @apiPermission User
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
 * @apiVersion 0.1.1
 * @apiName Set RSVP
 *
 * @apiGroup Users
 * @apiPermission User
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
    console.error(error);
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
    .catch(err => errorHandler500(err, next));
});


/**
 * @api {get} /users/rsvp Get the RSVP status for a user
 * @apiVersion 0.1.1
 * @apiName get RSVP status
 *
 * @apiGroup Users
 * @apiPermission User
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
      res.status(200).send(status || { rsvp_status: false });
    })
    .catch(err => errorHandler500(err, next));
});


/**
 * @api {post} /users/travelReimbursement submit travel reimbursement information
 * @apiVersion 0.2.2
 * @apiName Travel Reimbursement
 * @apiGroup users
 * @apiUse AuthArgumentRequired
 * @apiParam {String} fullName first and last names of the user as they would appear on a check.
 * @apiParam {Number} reimbursementAmount the total amount of money they are requesting, as appears on their receipts
 * @apiParam {String} mailingAddress the full postal address of the user
 * @apiParam {enum} groupMembers ["1", "2", "3", "4+"]
 * @apiParam {FILE} [receipt] The receipt files for this user, users can send up to 5 files all under fieldname receipt. (Max size: 5 MB each)
 * @apiPermission valid user credentials
 * @apiSuccess {String} Success
 * @apiUse IllegalArgumentError
 */
router.post('/travelreimbursement', upload.array('receipt', 5), (req, res, next) => {
  if (!parseInt(req.body.reimbursementAmount, 10)) {
    const error = new Error();
    error.body = { error: 'Reimbursement amount must be a number' };
    error.status = 400;
    return next(error);
  }
  req.body.reimbursementAmount = parseInt(req.body.reimbursementAmount, 10);
  if (!req.body || !validateReimbursement(req.body)) {
    const error = new Error();
    error.body = { error: 'Request body must be set and be valid' };
    error.status = 400;
    return next(error);
  }
  req.body.reimbursementAmount =
    adjustReimbursementPrice(req.body.reimbursementAmount, req.body.groupMembers);
  req.body.receiptURIs = req.files.map(file =>
    `https://s3.${constants.s3Connection.region}
    .amazonaws.com/${constants.s3Connection.s3TravelReimbursementBucket}
    /${file.key}`)
    .join(',');
  new TravelReimbursement(Object.assign(req.body, { uid: res.locals.user.uid }))
    .add()
    .then(() => {
      res.status(200)
        .send({
          amount: req.body.reimbursementAmount,
        });
    })
    .catch(error => errorHandler500(error, next));
});

/**
 * @api {post} /users/project Post the project details to get the table assignment
 * @apiVersion 0.4.0
 * @apiName Post user project data
 * @apiGroup Users
 * @apiPermission User
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
  console.log(req.body);
  if (!res.locals.user) {
    const error = new Error();
    error.body = { error: 'Could not find user' };
    error.status = 400;
    return next(error);
  }
  const project = new Project(req.body, req.uow);
  if (!project.validate() || !project.team.map(validator.validate).every(value => value)) {
    const error = new Error();
    error.status = 400;
    error.body = {
      result: 'Some properties were not as expected. Make sure you provide a list of team members and categories',
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
      if (!uids.has(res.locals.user.uid)) {
        uids.add(res.locals.user.uid);
      }
      const { categories } = req.body;
      if (!categories ||
        !Array.isArray(categories) ||
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
      if (err.errno === 1452) {
        // Registration could not be found.
        err.status = 404;
        throw err;
      }
      throw err;
    })
    .then((result) => {
      if (process.env.APP_ENV === 'debug') {
        console.debug(result);
      }
      project.projectId = result[1][0].projectID;
      // Project ID returned here.
      // Assign a table now
      return project.assignTable();
    })
    .then(result => res.status(200).send(result[1][0]))
    .catch(err => errorHandler500(err, next));
});

/**
 * @api {get} /user/event/categories Get all the event categories
 * @apiName Get Event Categories
 * @apiVersion 0.3.2
 * @apiGroup User
 * @apiPermission Authenticated
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
 * @api {get} /admin/hackathon/active Get the uid, name, and pin base of the active hackathon
 * @apiVersion 0.3.2
 * @apiName active hackathon
 * @apiGroup Admin
 * @apiPermission Exec
 *
 * @apiUse AuthArgumentRequired
 *
 * @apiSuccess {Array} Array containing name of active hackathon
 */
router.get('/hackathon/active', (req, res, next) => {
  Hackathon.getActiveHackathon(req.uow)
    .then((data) => {
      res.type('json').status(200).send(data[0]);
    })
    .catch(err => errorHandler500(err, next));
});

module.exports = router;
