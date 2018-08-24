/* eslint-disable func-names */
// Thin wrapper around the firebase auth functions
const admin = require('firebase-admin');
const { logger } = require('./logging');

/**
 * Checks if the provided token is authenticated
 * @param idtoken
 * @return {Promise<admin.auth.DecodedIdToken>}
 */
function checkAuthentication(idtoken) {
  return admin.auth().verifyIdToken(idtoken);
}
module.exports.checkAuthentication = checkAuthentication;

/**
 * Makes the provided UID an administrator with the provided privilege level
 * @param uid
 * @param privilege
 * @return {Promise<void>}
 */
module.exports.elevate = function (uid, privilege) {
  return admin.auth().setCustomUserClaims(uid, { admin: true, privilege });
};

/**
 * Retrieve the userID base on the email provided
 *  @param email
 *  @return Promise{admin.auth.UserRecord}
 */
module.exports.getUserId = function (email) {
  return admin.auth().getUserByEmail(email);
};

/**
 *
 * @param uid
 * @return {Promise<admin.auth.UserRecord>}
 */
module.exports.getUserData = function (uid) {
  return admin.auth().getUser(uid);
};

/**
 * This function checks if the current user has the permissions required to access the function
 * Precondition: Must have called verifyAuthMiddleware or similar function that
 *              stores the auth object in res.locals
 * @param {Number} level The level of access [1,4] that the function needs
 * @return {Function}
 */
module.exports.verifyACL = function (level) {
  return function (req, res, next) {
    if (process.env.NODE_ENV === 'debug') {
      // Remove if you require idtoken support locally
      return next();
    }
    if (!res.locals.user.privilege) {
      const error = new Error();
      error.status = 401;
      error.body = { error: 'You do not have sufficient permissions for this operation' };
      return next(error);
    }
    if (res.locals.user.privilege < level) {
      const error = new Error();
      error.status = 401;
      error.body = { error: 'You do not have sufficient permissions for this operation' };
      return next(error);
    }
    return next();
  };
};

/**
 * User authentication middleware
 */
module.exports.verifyAuthMiddleware =
  function (req, res, next) {
    if (process.env.APP_ENV === 'debug') {
      return next();
    }
    if (!req.headers.idtoken) {
      const error = new Error();
      error.status = 401;
      error.body = { error: 'ID Token must be provided' };
      return next(error);
    }
    return checkAuthentication(req.headers.idtoken)
      .then((decodedToken) => {
        res.locals.user = decodedToken;
        try {
          res.locals.privilege = decodedToken.privilege;
        } catch (e) {
          logger.info(e);
        }
        return next();
      })
      .catch((err) => {
        const error = new Error();
        error.status = 401;
        error.body = err.message;
        return next(error);
      });
  };
