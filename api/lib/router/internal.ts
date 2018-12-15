const express = require('express');
const Metrics = require('../services/logging/monitoring');

const router = express.Router();

/** ********* GLOBAL MIDDLEWARE ****** */
router.use((req, res, next) => {
  if (!req.headers['x-appengine-cron']) {
    const error = new Error();
    error.status = 401;
    error.message = 'You cannot call internal URLs';
    return next(error);
  }
  return next();
});

module.exports = router;
