const express = require('express');
const Ajv = require('ajv');


const database = require('../helpers/database');
const {rediskey, rfidAssignmentSchema, rfidScansSchema} = require('../helpers/constants');

const ajv = new Ajv({allErrors: true});
const router = express.Router();
/*************** HELPER FUNCTIONS ***************/


/*************** HELPER MIDDLEWARE **************/
router.use((req, res, next) => {
  if (req.headers.apikey && req.headers.apikey === rediskey) {
    next();
  } else {
    const error = new Error();
    error.status = 400;
    error.body = {message: 'Illegal access. Please check the credentials'};
    next(error);
  }
});


/*************** ROUTES *************************/

/**
 * @api {get} /pi/registrations Get all the registration data for the pi
 * @apiVersion 0.3.0
 * @apiName Get registration data for pi
 *
 * @apiGroup Pi
 * @apiPermission API Key validation
 *
 * @apiUse ApiKeyArgumentRequired
 * @apiSuccess {Array} Contains all data required by the pi
 * @apiUse IllegalArgumentError
 */
router.get('/registrations', (req, res, next) => {
  let arr = [];
  database.getRegistrations(null, null, {fields: ['uid', 'pin', 'firstname', 'lastname', 'shirt_size', 'dietary_restriction']})
    .on('data', document => arr.push(document))
    .on('err', (err) => {
      const error = new Error();
      error.status = 500;
      error.body = err.message;
      next(error);
    })
    .on('end', () => {
      res.status(200).send(arr);
    });
});

/**
 * @api {post} /pi/assignment Assign RFID tags ID to users
 * @apiVersion 0.3.0
 * @apiName Assign an RFID to a user
 *
 * @apiGroup Pi
 * @apiPermission API Key Validation
 *
 * @apiUse ApiKeyArgumentRequired
 * @apiParam {Array} assignments An array of RFID tags to User uid assignments
 * @apiParamExample {json} Request-Example:
 *     [
 *      {
 *       "rfid": "1vyv2boy1v3b4oi12-1234lhb1234b",
 *       "uid": "nbG7b87NB87nB7n98Y7",
 *       "time": 1239712938120
 *     },
 *     { ... }
 *     ]
 * @apiSuccess {String} Success
 * @apiUse IllegalArgumentError
 */
router.post('/assignment', (req, res, next) => {
  const validate = ajv.compile(rfidAssignmentSchema);
  if (req.body && req.body.assignments && validate(req.body.assignments)) {
    // LEGAL
    database.addRfidAssignments(req.body.assignments)
      .then(() => {
        res.status(200).send({message: "success"});
      }).catch((err) => {
      const error = new Error();
      error.status = 500;
      error.body = err.message;
      next(error);
    });
  } else {
    const error = new Error();
    error.status = 400;
    error.body = {message: 'Assignments must be provided as a valid Json Array'};
    next(error);
  }
});


/**
 * @api {post} /pi/scans Upload scans from the event
 * @apiVersion 0.3.0
 * @apiName Submit scans from the event
 *
 * @apiGroup Pi
 * @apiPermission API Key Validation
 *
 * @apiUse ApiKeyArgumentRequired
 * @apiParam {Array} scans An array of scan objects
 * @apiParamExample {json} Request-Example:
 *     [
 *      {
 *       "rfid_uid": "1vyv2boy1v3b4oi12-1234lhb1234b",
 *       "scan_location": "nbG7b87NB87nB7n98Y7",
 *       "scan_time": 1239712938120
 *     },
 *     { ... }
 *     ]
 * @apiSuccess {String} Success
 * @apiUse IllegalArgumentError
 */
router.post('/scans', (req, res, next) => {
  const validate = ajv.compile(rfidScansSchema);
  if (req.body && req.body.scans && validate(req.body.scans)) {
    // LEGAL
    database.addRfidAssignments(req.body.scans)
      .then(() => {
        res.status(200).send({message: "success"});
      }).catch((err) => {
      const error = new Error();
      error.status = 500;
      error.body = err.message;
      next(error);
    });
  } else {
    const error = new Error();
    error.status = 400;
    error.body = {message: 'Assignments must be provided as a valid Json Array'};
    next(error);
  }
});


module.exports = router;