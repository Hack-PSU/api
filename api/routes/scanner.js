/* eslint-disable consistent-return */
const express = require('express');
const Ajv = require('ajv');
const squel = require('squel');
const database = require('../services/database');
const { errorHandler500, streamHandler } = require('../services/functions');
const { Registration } = require('../models/Registration');
const { rfidAssignmentSchema, rfidScansSchema } =
  require('../assets/schemas/load-schemas')(['rfidAssignmentSchema', 'rfidScansSchema']);
const { redisKey } = require('../assets/constants/constants');
const { Location } = require('../models/Location');

const router = express.Router();

const ajv = new Ajv({ allErrors: true });
/** ************* HELPER FUNCTIONS ************** */


/** ************* HELPER MIDDLEWARE ************* */
router.use((req, res, next) => {
  if (process.env.APP_ENV === 'debug') {
    return next();
  }
  if (!req.headers.apikey ||
      req.headers.apikey !== redisKey) {
    const error = new Error();
    error.status = 400;
    error.body = { message: 'Illegal access. Please check the credentials' };
    return next(error);
  }
  next();
});

/** ************* ROUTES ************************ */

/**
 * @apiDeprecated use /scanner/registrations
 * @api {get} /pi/registrations Get all the registration data for the pi
 * @apiVersion 0.4.0
 * @apiName Get registration data for pi
 *
 * @apiGroup Scanner
 * @apiPermission API Key validation
 *
 * @apiUse ApiKeyArgumentRequired
 * @apiSuccess {Array} Contains all data required by the pi
 * @apiUse IllegalArgumentError
 */
/**
 * @api {get} /scanner/registrations Get all the registration data for the pi
 * @apiVersion 1.0.0
 * @apiName Get registration data for pi
 *
 * @apiGroup Scanner
 * @apiPermission API Key validation
 *
 * @apiUse ApiKeyArgumentRequired
 * @apiSuccess {Array} Contains all data required by the pi
 * @apiUse IllegalArgumentError
 */
router.get('/registrations', (req, res, next) => {
  Registration.getAll(
    req.uow,
    {
      fields: ['reg.uid',
        // Subtract the base pin for the current hackathon from the retrieved pin.
        `reg.pin - (${squel.select({
          autoQuoteTableNames: false,
          autoQuoteFieldNames: false,
        }).from('HACKATHON').field('base_pin').where('active = 1')
          .toString()}) AS pin`,
        'reg.firstname',
        'reg.lastname',
        'reg.shirt_size',
        'reg.dietary_restriction'],
      currentHackathon: true,
      quoteFields: false,
    },
  ).then(stream => streamHandler(stream, res, next));
});

/**
 * @apiDeprecated use /scanner/assignment
 * @api {post} /pi/assignment Assign RFID tags ID to users
 * @apiVersion 0.4.0
 * @apiName Assign an RFID to a user
 *
 * @apiGroup Scanner
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
/**
 * @api {post} /scanner/assignment Assign RFID tags ID to users
 * @apiVersion 1.0.0
 * @apiName Assign an RFID to a user
 *
 * @apiGroup Scanner
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
  database.addRfidAssignments(req.uow, req.body.assignments)
    .then(() => {
      res.status(200).send({ message: 'success' });
    })
    .catch(err => errorHandler500(err, next));
});

/**
 * @apiDeprecated use /scanner/scans
 * @api {post} /pi/scans Upload scans from the event
 * @apiVersion 0.4.0
 * @apiName Submit scans from the event
 *
 * @apiGroup Scanner
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
/**
 * @api {post} /scanner/scans Upload scans from the event
 * @apiVersion 1.0.0
 * @apiName Submit scans from the event
 *
 * @apiGroup Scanner
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
  database.addRfidScans(req.uow, req.body.scans)
    .then(() => {
      res.status(200).send({ message: 'success' });
    }).catch(err => errorHandler500(err, next));
});

/**
 * @api {get} /scanner/location Get the list of existing location from the database
 * @apiVersion 1.0.0
 * @apiName Get Location List (Scanner)
 * @apiGroup Scanner
 * @apiPermission API Key Validation
 * @apiParam {Number} timestamp Optional parameter that returns the locations relevant
 * to the timestamp
 *
 * @apiSuccess {Array} Array containing all locations in the database
 */
router.get('/location', (req, res, next) => {
  let promise;
  if (req.query.timestamp) {
    promise = Location.getActiveLocations(req.uow, req.query.timestamp);
  } else {
    promise = Location.getAll(req.uow);
  }
  promise
    .then(stream => streamHandler(stream, res, next))
    .catch(err => errorHandler500(err, next));
});

module.exports = router;
