const express = require('express');
const Stringify = require('streaming-json-stringify');

const authenticator = require('../assets/helpers/auth');

const Update = require('../assets/models/Update');

const router = express.Router();

/** *********** HELPER FUNCTIONS ************* */
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
    error.body = { error: 'ID Token must be provided' };
    next();
  }
});

/** ************ ROUTING MIDDLEWARE ********************** */


/** ********* UPDATES ******** */
router.get('/updates', (req, res, next) => {
  Update.getAll(req.rtdb)
    .then((stream) => {
      stream
        .pipe(Stringify())
        .pipe(res.type('json').status(200))
        .on('error', (err) => {
          const error = new Error();
          error.status = 500;
          error.body = err.message;
          next(error);
        }).on('end', res.end);
    });
});

router.post('/updates', (req, res, next) => {
  new Update({ update_title: 'test update' }, req.rtdb).add()
    .then((data) => {
      res.status(200).send(data);
    }).catch(next);
});

/** ********** EVENTS ******** */


module.exports = router;
