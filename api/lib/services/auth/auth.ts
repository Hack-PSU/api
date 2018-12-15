/* eslint-disable func-names */
// Thin wrapper around the firebase auth functions
import * as admin from 'firebase-admin';
import { HttpError } from '../../JSCommon/errors';
import { logger } from '../logging/logging';

// TODO: Convert to class
/**
 * Checks if the provided token is authenticated
 * @param idtoken
 * @return {Promise<admin.auth.DecodedIdToken>}
 */
export function checkAuthentication(idtoken) {
  return admin.auth().verifyIdToken(idtoken);
}

// module.exports.checkAuthentication = checkAuthentication;

/**
 * Makes the provided UID an administrator with the provided privilege level
 * @param uid
 * @param privilege
 * @return {Promise<void>}
 */
export function elevate(uid, privilege) {
  return admin.auth().setCustomUserClaims(uid, { admin: true, privilege });
}

/**
 * Retrieve the userID base on the email provided
 *  @param email
 *  @return Promise{admin.auth.UserRecord}
 */
export function getUserId(email) {
  return admin.auth().getUserByEmail(email);
}

/**
 *
 * @param uid
 * @return {Promise<admin.auth.UserRecord>}
 */
export function getUserData(uid) {
  return admin.auth().getUser(uid);
}

/**
 * This function checks if the current user has the permissions required to access the function
 * Precondition: Must have called verifyAuthMiddleware or similar function that
 *              stores the auth object in res.locals
 * @param {Number} level The level of access [1,4] that the function needs
 * @return {Function}
 */
export function verifyACL(level) {
  // TODO: Add support for an ACL matrix instead. Use Redis perhaps?
  return (req, res, next) => {
    if (process.env.NODE_ENV === 'debug') {
      // Remove if you require idtoken support locally
      return next();
    }
    if (!res.locals.user.privilege) {
      const error = new HttpError('insufficient permissions for this operation', 401);
      return next(error);
    }
    if (res.locals.user.privilege < level) {
      const error = new HttpError('insufficient permissions for this operation', 401);
      return next(error);
    }
    return next();
  };
}

/**
 * User authentication middleware
 */
export function verifyAuthMiddleware(req, res, next) {
  if (process.env.APP_ENV === 'debug') {
    return next();
  }
  if (!req.headers.idtoken) {
    const error = new HttpError('id token must be provided', 401);
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
      const error = new HttpError(err.message || err, 401);
      return next(error);
    });
}
