const express = require('express');
const Metrics = require('../services/monitoring');

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

router.get('/metrics', (req, res, next) => {
  const { connection } = req.uow;
  const hitMetrics = new Metrics(
    'mysql_metrics_hits',
    'Cache hit metrics for MySQL database',
    null,
    [
      {
        key: 'hits',
        valueType: 'DOUBLE',
        description: 'Cache hits for MySQL Queries',
      },
    ],
  );
  const missMetrics = new Metrics(
    'mysql_metrics_misses',
    'Cache miss metrics for MySQL database',
    null,
    [
      {
        key: 'misses',
        valueType: 'DOUBLE',
        description: 'Cache misses for MySQL Queries',
      },
    ],
  );

  Promise.all([
    hitMetrics.instantiate(),
    missMetrics.instantiate(),
  ])
    .then(() => Promise.all([
      hitMetrics.track(connection.hits, { metric_type: 'hits' }),
      missMetrics.track(connection.misses, { metric_type: 'misses' }),
    ]))
    .then(() => {
      res.status(200).send({ message: 'Logged metrics' });
    }).catch(next);
});

module.exports = router;
