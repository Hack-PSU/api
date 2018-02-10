const squel = require('squel');
// const admin = require('firebase-admin');
const sql = require('mysql');
const sqlOptions = require('../helpers/constants').sqlConnection;
const connection = sql.createConnection(sqlOptions);
const JSONStream = require('JSONStream');

connection.connect((err) => {
    if (err) {
        console.error(err.stack);
    }
});

/**
 * @return {Stream} Returns a continuous stream of data from the database
 */
function getRegistrations(limit) {
    const query = squel.select()
        .from("registrations")
        .limit(limit)
        .toString()
        .concat(';');
    return connection.query(query).stream();
    // return admin.firestore().collection('registered-hackers').stream();
}

/**
 * @return {Stream} Returns a continuous stream of data from the database
 */
function getPreRegistrations(limit) {
    const query = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
        .from("PRE_REGISTRATION")
        .limit(limit)
        .toString().concat(';');
    console.log(query);
    return connection.query(query).stream();
    // return admin.firestore().collection('pre-registered').stream();
}


module.exports.getRegistrations = getRegistrations;
module.exports.getPreRegistrations = getPreRegistrations;