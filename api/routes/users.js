const express = require('express');
const functions = require("../helpers/functions");
const authenticator = require("../helpers/auth");
const constants = require("../helpers/constants");
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
 * @apiVersion 0.1.1
 * @apiName Set RSVP
 *
 * @apiGroup Users
 * @apiPermission User
 *
 * @apiParam {String} A value to indicate if the user decide to rsvp ['true', 'false']
 *
 * @apiUse AuthArgumentRequired
 * @apiSuccess sends a email with user's pin
 * @apiUse IllegalArgumentError
 */
router.post('/rsvp', (req, res, next) => {
  if (req.body && (typeof req.body.rsvp !== 'undefined')) {
    if (res.locals.user) {
      database.setRSVP(res.locals.user.uid, req.body.rsvp === 'true')
        .then(() => {
          if (req.body.rsvp === 'true') {
            let user = null;
            database.getRegistration(res.locals.user.uid)
              .on('data', (data) => {
                user = data;
              }).on('err', (err) => { // Database registration retrieval
              const error = new Error();
              error.status = 500;
              error.body = err.message;
              console.error(error);
              next(error);
            }).on('end', () => {
              let email = user.email;
              let name = user.firstname + user.lastname;
              let pin = user.pin;
              functions.emailSubstitute(constants.RSVPEmailHtml.text, name, {
                name: name,
                pin: parseInt(pin, 10).toString(14).padStart(3, '0'),
              })
                .then((subbedHTML) => {
                  const request = functions.createEmailRequest(email, subbedHTML, constants.RSVPEmailHtml.subject, "");
                  functions.sendEmail(request.data)
                    .then(() => {
                      res.status(200).send({message: 'success', pin: parseInt(pin, 10).toString(14).padStart(3, '0')});
                      // resolve({'email': request.data.to, 'html': request.data.htmlContent, 'response': 'success'});
                    })
                    .catch((err) => { // Send Email error
                      const error = new Error();
                      error.status = 500;
                      error.body = err.message;
                      console.error(error);
                      next(error);
                    });
                }).catch((err) => { // Email Substitute error
                const error = new Error();
                error.status = 500;
                error.body = err.message;
                console.error(error);
                next(error);
              });
            })
          } // End if
          else {
            res.status(200).send({message: 'success'});
          }
        }).catch((err) => { // Set RSVP error
        const error = new Error();
        error.status = 500;
        error.body = err.message;
        console.error(error);
        next(error);
      });
    } else {
      const error = new Error();
      error.status = 400;
      error.body = {error: 'Could not identify user'};
      console.error(error);
      next(error);
    }
  } else {
    const error = new Error();
    error.status = 400;
    error.body = {error: 'RSVP value must be included'};
    next(error);
  }
});


/**
 * @api {get} /users/rsvp_status confirm the RSVP status for the current user and send a email containing their pin
 * @apiVersion 0.1.1
 * @apiName get RSVP status
 *
 * @apiGroup Users
 * @apiPermission User
 *
 * @apiUse AuthArgumentRequired
 * @apiSuccess {Object} Containing the rsvp status based on the uid
 * @apiUse IllegalArgumentError
 */
router.get('/rsvp_status', (req, res, next) => {
  if (res.local.user) {
    dataBase.getRSVP(res.local.user.uid)
      .then((RSVP_status) => {
        res.status(200).send({status: RSVP_status});
      }).catch((err) => {
        const error = new Error();
        error.status = error.status || 500;
        error.body = error.message;
        next(error);
      })
  } else {
    const error = new Error();
    error.status = 400;
    error.body = {error: 'Could not identify user'}
    next(error);
  }
})

module.exports = router;
