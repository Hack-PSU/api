const admin = require('firebase-admin');

/**
 * Checks if the provided token is authenticated
 * @param idToken
 * @return {Promise<admin.auth.DecodedIdToken>}
 */
function checkAuthentication(idToken) {
    return admin.auth().verifyIdToken(idToken);
}

/**
 * Makes the provided UID an administrator with the provided provilege level
 * @param uid
 * @param privilege
 * @return {Promise<any>}
 */
function elevate(uid, privilege) {
    return admin.auth().setCustomUserClaims(uid, { admin: true, privilege });
}


module.exports.checkAuthentication = checkAuthentication;
module.exports.elevate = elevate;
