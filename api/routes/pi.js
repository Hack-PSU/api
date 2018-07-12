/* eslint-disable consistent-return */
const express = require('express');
const Ajv = require('ajv');
const squel = require('squel');
const database = require('../services/database');
const { errorHandler500 } = require('../services/functions');
const { Registration } = require('../models/Registration');
const { rediskey, rfidAssignmentSchema, rfidScansSchema } = require('../assets/constants/constants');

const router = express.Router();


const ajv = new Ajv({ allErrors: true });
/** ************* HELPER FUNCTIONS ************** */


/** ************* HELPER MIDDLEWARE ************* */
router.use((req, res, next) => {
  if (process.env.APP_ENV === 'debug') {
    return next();
  }
  if (!req.headers.apikey ||
    req.headers.apikey !== rediskey) {
    const error = new Error();
    error.status = 400;
    error.body = { message: 'Illegal access. Please check the credentials' };
    return next(error);
  }
  next();
});


/** ************* ROUTES ************************ */

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
  const arr = [];
  Registration.getAll(
    req.uow,
    {
      fields: ['uid',
        // Subtract the base pin for the current hackathon from the retrieved pin.
        `pin - (${squel.select({
          autoQuoteTableNames: false,
          autoQuoteFieldNames: false,
        }).from('HACKATHON').field('base_pin').where('active = 1')
          .toString()}) AS pin`,
        'firstname',
        'lastname',
        'shirt_size',
        'dietary_restriction'],
      currentHackathon: true,
      quoteFields: false,
    },
  ).then((stream) => {
    stream.pipe(res)
      .on('err', err => errorHandler500(err, next))
      .on('end', () => {
        res.status(200).send(arr);
      });
  }).catch(err => errorHandler500(err, next));
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
  if (!req.body ||
    !req.body.assignments ||
    !validate(req.body.assignments)) {
    const error = new Error();
    error.status = 400;
    error.body = { message: 'Assignments must be provided as a valid Json Array' };
    return next(error);
  }
  // LEGAL
  database.addRfidAssignments(req.body.assignments, req.uow)
    .then(() => {
      res.status(200).send({ message: 'success' });
    })
    .catch(err => errorHandler500(err, next));
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
  if (!req.body ||
    !req.body.scans ||
    !validate(req.body.scans)) {
    const error = new Error();
    error.status = 400;
    error.body = { message: 'Assignments must be provided as a valid Json Array' };
    return next(error);
  }
  // LEGAL
  database.addRfidScans(req.body.scans, req.uow)
    .then(() => {
      res.status(200).send({ message: 'success' });
    }).catch(err => errorHandler500(err, next));
});

module.exports = router;
