/* eslint-disable func-names */
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
 * Makes the provided UID an administrator with the provided provilege level
 * @param uid
 * @param privilege
 * @return {Promise<any>}
 */
module.exports.elevate = function (uid, privilege) {
  return admin.auth().setCustomUserClaims(uid, { admin: true, privilege });
};

/**
 * Retreive the userID base on the email provided
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
