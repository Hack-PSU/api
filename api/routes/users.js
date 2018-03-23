const express = require('express');
const functions = require("../helpers/functions");
const authenticator = require("../helpers/auth");
const constants = require("../helpers/constant");
const database = require('../helpers/database');

const router = express.Router();

/************* HELPER FUNCTIONS **************/
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
 * @api {post} /users/RSVP confirm the RSVP status for the current user and send a email containing their pin
 * @apiVersion 0.3.1
 * @apiName Set RSVP
 *
 * @apiGroup Users
 * @apiPermission User
 *
 * @apiParam {Boolean} A value to indicate if the user decide to rsvp
 *
 * @apiUse AuthArgumentRequired
 * @apiSuccess sends a email with user's pin
 * @apiUse IllegalArgumentError
 */
router.post('/rsvp', (req, res, next) => {
  if (req.body && (req.body.rsvp !== null)) {
    if (res.locals.user) {
      database.setRSVP(res.locals.user.uid, req.body.rsvp)
        .then(() => {
          if (req.body.rsvp === true) {
            database.getRegistration(res.locals.user.uid)
              .on('data', (data) => {
                let email = data.email;
                let name = data.firstname + data.lastname;
                let pin = data.pin;
                functions.emailSubstitute(constants.RSVPEmailHtml.text, name, [{
                  name: name,
                  pin: parseInt(pin, 10).toString(14),
                }])
                  .then((subbedHTML) => {
                    const request = functions.createEmailRequest(email, subbedHTML, constants.RSVPEmailHtml.subject, "");
                    functions.sendEmail(request.data)
                      .then(() => {
                        res.status(200).send({message: 'success', pin: parseInt(pin, 10).toString(14)});
                        // resolve({'email': request.data.to, 'html': request.data.htmlContent, 'response': 'success'});
                      })
                      .catch((err) => { // Send Email error
                        const error = new Error();
                        error.status = 500;
                        error.body = err.message;
                        next(error);
                      });
                  }).catch((err) => { // Email Substitute error
                  const error = new Error();
                  error.status = 500;
                  error.body = err.message;
                  next(error);
                });
              }).on('err', (err) => {
              const error = new Error();
              error.status = 500;
              error.body = err.message;
              next(error);
            });
          }
        }).catch((err) => {
        const error = new Error();
        error.status = 500;
        error.body = err.message;
        next(error);
      });
    } else {
      const error = new Error();
      error.status = 400;
      error.body = {error: 'Could not identify user'};
      next(error);
    }
  } else {
    const error = new Error();
    error.status = 400;
    error.body = {error: 'RSVP value must be included'};
    next(error);
  }
})
;


module.exports = router;
