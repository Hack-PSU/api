/* eslint-disable consistent-return */

const express = require('express');
const Stringify = require('streaming-json-stringify');

const authenticator = require('../services/auth');
const { errorHandler500 } = require('../services/functions');

const Update = require('../models/Update');

const router = express.Router();

/** *********** HELPER FUNCTIONS ************* */
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
      next();
    })
    .catch((err) => {
      const error = new Error();
      error.status = 401;
      error.body = err.message;
      next(error);
    });
});

/** ************ ROUTING MIDDLEWARE ********************** */


/** ********* UPDATES ******** */
/**
 * TODO: Add APIDoc
 */
// TODO: Add test
router.get('/updates', (req, res, next) => {
  Update.getAll(req.rtdb)
    .then((stream) => {
      stream
        .pipe(Stringify())
        .pipe(res.type('json').status(200))
        .on('error', err => errorHandler500(err, next))
        .on('end', res.end);
    });
});

/**
 * TODO: Add ApiDoc
 */
// TODO: Add test
router.post('/updates', (req, res, next) => {
  new Update({ update_title: 'test update' }, req.rtdb).add()
    .then((data) => {
      res.status(200).send(data);
    }).catch(err => errorHandler500(err, next));
});

/** ********** EVENTS ******** */


module.exports = router;
