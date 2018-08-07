/* eslint-disable func-names */
// Thin wrapper around the firebase auth functions
const admin = require('firebase-admin');
/**
 * Checks if the provided token is authenticated
 * @param idtoken
 * @return {Promise<admin.auth.DecodedIdToken>}
 */
module.exports.checkAuthentication = function (idtoken) {
  return admin.auth().verifyIdToken(idtoken);
};

/**
 * Makes the provided UID an administrator with the provided privilege level
 * @param uid
 * @param privilege
 * @return {Promise<any>}
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
 * @param {Number} level The level of access [1,4] that the function needs
 * @return {Function}
 */
module.exports.verifyACL = function verifyACL(level) {
  return function (req, res, next) {
    if (process.env.NODE_ENV === 'debug') {
      // Remove if you require idtoken support locally
      return next();
    }
    if (!res.locals.privilege) {
      const error = new Error();
      error.status = 500;
      error.body = { error: 'Something went wrong while accessing permissions' };
      return next(error);
    }
    if (res.locals.privilege < level) {
      const error = new Error();
      error.status = 401;
      error.body = { error: 'You do not have sufficient permissions for this operation' };
      return next(error);
    }
    next();
  };
};

/**
 * User authentication middleware
 */
module.exports.verifyAuthMiddleware =
  function verifyAuthMiddleware(req, res, next) {
    if (process.env.APP_ENV === 'debug') {
      return next();
    }
    if (!req.headers.idtoken) {
      const error = new Error();
      error.status = 401;
      error.body = { error: 'ID Token must be provided' };
      return next(error);
    }
    checkAuthentication(req.headers.idtoken)
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
  };
