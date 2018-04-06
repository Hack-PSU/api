const express = require('express');
const Ajv = require('ajv');

const authenticator = require("../helpers/auth");
const database = require('../helpers/database');
const {projectRegistrationSchema} = require('../helpers/constants');


const ajv = new Ajv({allErrors: true});



const router = express.Router();

/************* HELPER FUNCTIONS **************/

function validateProjectRegistration(project) {
  const validate = ajv.compile(projectRegistrationSchema);
  if (process.env.NODE_ENV === 'test') {
    validate(project);
    console.error(validate.errors);
  }
  return !!validate(project);
}

/**
 * User authentication middleware
 */
router.use((req, res, next) => {
  if (req.headers.idtoken) {
    authenticator.checkAuthentication(req.headers.idtoken)
      .then((decodedToken) => {
        res.locals.user = decodedToken;
        next();
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


/************* ROUTING MIDDLEWARE ************/
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
  if (res.locals.user) {
    res.status(200).send({admin: res.locals.user.admin, privilege: res.locals.user.privilege});
  } else {
    const error = new Error();
    error.status = 500;
    error.body = {error: 'Could not retrieve user information'};
    next(error);
  }
});

/**
 * @api {get} /users/registration Get the registration information for the current user
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
  if (res.locals.user) {
    let user = null;
    database.getRegistration(res.locals.user.uid)
      .on('data', (data) => {
        user = data;
      }).on('err', (err) => {
      const error = new Error();
      error.status = 500;
      error.body = err.message;
      next(error);
    }).on('end', () => {
      res.status(200).send(user);
    });
  } else {
    const error = new Error();
    error.status = 500;
    error.body = {error: 'Could not retrieve user information'};
    next(error);
  }
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
  if (res.locals.user) {
    let info = [];
    database.getProjectInfo(res.locals.user.uid)
      .on('data', (data) => {
        // Due to stream nature, data may be partial array or full array of responses
        info.push(data);
      }).on('err', (err) => {
      const error = new Error();
      error.status = 500;
      error.body = err.message;
      next(error);
    }).on('end', () => {
      // Reduce the large number of responses that differ by
      // category name and id into a json array internally instead
      const rJSON = info.reduce((accumulator, currentVal) => {
        Object.keys(currentVal).forEach((k) => {
          if (k !== 'categoryName' && k !== 'categoryID') { // If the field is going to be the same
            accumulator[k] = currentVal[k];
          } else { // Else accumulate it in an array
            if (accumulator[k]) {
              accumulator[k].push(currentVal[k]);
            } else {
              accumulator[k] = [currentVal[k]];
            }
          }
        });
        return accumulator;
      }, {});
      res.status(200).send(rJSON);
    });
  } else {
    const error = new Error();
    error.status = 500;
    error.body = {error: 'Could not retrieve user information'};
    next(error);
  }
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
  if (res.locals.user) {
    // User is present
    /********************************/

    // Check for data format
    if (validateProjectRegistration(req.body)) {
      // Valid project
      const uidPromises = req.body.team.map(email => authenticator.getUserId(email));
      Promise.all(uidPromises)
        .then((records) => {
          const uids = records.map(r => r.uid);
          // uids contains an array of uids
          if (!uids.includes(res.locals.user.uid)) {
            uids.push(res.locals.user.uid);
          }
          const categories = req.body.categories;
          if (categories && Array.isArray(categories) && categories.length === categories.filter((value) => value.match(/\d+/)).length) {
            // Categories array is valid
            database.storeProjectInfo(req.body.projectName, uids, categories)
              .then((result) => {
                if (process.env.NODE_ENV === 'test') {
                  console.log(result);
                }
                // Project ID returned here.
                // Assign a table now
                database.assignTable(result[0].projectID, categories)
                  .then((result) => {
                    res.status(200).send(result);
                  }).catch((err) => {
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
            error.body = {result: 'Some categories were not valid. Check and try again'};
            error.status = 400;
            next(error);
          }
        }).catch((err) => {
        const error = new Error();
        error.status = 400;
        error.body = {
          result: 'Some emails were not associated with an account. Please check your input and try again.',
          info: err.message,
        };
        next(error);
      });
    } else {
      const error = new Error();
      error.status = 400;
      error.body = {
        result: 'Some properties were not as expected. Make sure you provide a list of team members and categories',
      };
      next(error);
    }
  }
});


module.exports = router;
