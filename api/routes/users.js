const express = require('express');
const authenticator = require("../helpers/auth");

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

module.exports = router;
