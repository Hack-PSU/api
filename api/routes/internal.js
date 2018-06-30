const express = require('express');
const Metrics = require('../services/monitoring');
const { _dbConnection } = require('../services/factories/uow_factory');


const router = express.Router();

/** ********* GLOBAL MIDDLEWARE ****** */
router.use((req, res, next) => {
  if (!req.headers('X-Appengine-Cron')) {
    const error = new Error();
    error.status = 401;
    error.message = 'You cannot call internal URLs';
    return next(error);
  }
  return next();
});

router.get('/metrics', (req, res, next) => {
  const metrics = new Metrics(
    'mysql_metrics',
    'Metrics for MySQL database',
    null, [
      {
        key: 'hits',
        valueType: 'DOUBLE',
        description: 'Cache hits for MySQL Queries',
      },
      {
        key: 'misses',
        valueType: 'DOUBLE',
        description: 'Cache misses for MySQL Queries',
      },
    ],
  );
  metrics.instantiate()
    .then(() => Promise.all([
      metrics.track(_dbConnection.hits, 'hits'),
      metrics.track(_dbConnection.misses, 'misses'),
    ]))
    .then(() => {
      res.status(200).send({ message: 'Logged metrics' });
    }).catch(next);
});

module.exports = router;
