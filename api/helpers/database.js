const squel = require('squel');
const sql = require('mysql');
const uuidv4 = require('uuid/v4');

const sqlOptions = require('../helpers/constants').sqlConnection;
const connection = sql.createConnection(sqlOptions);

connection.connect((err) => {
    if (err) {
        console.error(err.stack);
    }
});

/**
 * @return {Stream} Returns a continuous stream of data from the database
 */
function getRegistrations(limit) {
    const query = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
        .from("REGISTRATION")
        .limit(limit ? limit : null)
        .toString()
        .concat(';');
    return connection.query(query).stream();
}

/**
 * @return {Stream} Returns a continuous stream of data from the database
 */
function getPreRegistrations(limit) {
    const query = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
        .from("PRE_REGISTRATION")
        .limit(limit ? limit : null)
        .toString().concat(';');
    console.log(query);
    return connection.query(query).stream();
}

/**
 *
 * @param email
 * @return {Promise<any>}
 */
function addPreRegistration(email) {
    const query = squel.insert({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
        .into(process.env.NODE_ENV === 'test' ? 'PRE_REGISTRATION_TEST' : 'PRE_REGISTRATION')
        .set('id', uuidv4().replace(/-/g, ""))
        .set('email', email)
        .toString()
        .concat(';');
    return new Promise((resolve, reject) => {
        connection.query(query, (err, result) => {
           if (err && err.errno === 1062) {
               const error = new Error();
               error.message  = "Email already provided";
               error.status = 400;
               reject(error);
           } else if (err) {
               reject(err);
           } else {
               resolve(result);
           }
        });
    });
}
module.exports = {
    getRegistrations,
    getPreRegistrations,
    addPreRegistration,
};