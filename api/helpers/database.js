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
 * @param limit {Number} Limit the number of rows to retrieve
 * @param offset {Number} Offset from start to retrieve at
 * @return {Stream} Returns a continuous stream of data from the database
 */
function getRegistrations(limit, offset) {
    const mLimit = parseInt(limit);
    const mOffset = parseInt(offset);
    const query = squel.select({autoQuoteTableNames: true, autoQuoteFieldNames: true})
        .from("REGISTRATION")
        .limit(mLimit ? mLimit : null)
        .offset(mOffset ? mOffset : null)
        .toString()
        .concat(';');
    return connection.query(query).stream();
}

/**
 * @param limit {Number} Limit the number of rows to retrieve
 * @param offset {Number} Offset from start to retrieve at
 * @return {Stream} Returns a continuous stream of data from the database
 */
function getPreRegistrations(limit, offset) {
    const mLimit = parseInt(limit);
    const mOffset = parseInt(offset);
    const query = squel.select({autoQuoteTableNames: true, autoQuoteFieldNames: true})
        .from("PRE_REGISTRATION")
        .limit(mLimit ? limit : null)
        .offset(mOffset ? offset : null)
        .toString().concat(';');
    return connection.query(query).stream();
}

/**
 *
 * @param email {String} the email
 * @return {Promise<any>}
 */
function addPreRegistration(email) {
    const query = squel.insert({autoQuoteTableNames: true, autoQuoteFieldNames: true})
        .into(process.env.NODE_ENV === 'test' ? 'PRE_REGISTRATION_TEST' : 'PRE_REGISTRATION')
        .setFieldsRows([
            {id: uuidv4().replace(/-/g, ""), email: email},
        ])
        .toParam();
    query.text = query.text.concat(';');
    return new Promise((resolve, reject) => {
        connection.query(query.text, query.values, (err, result) => {
            if (err && err.errno === 1062) {
                const error = new Error();
                error.message = "Email already provided";
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

function addRegistration(data) {
    const query = squel.insert({autoQuoteTableNames: true, autoQuoteFieldNames: true})
        .into(process.env.NODE_ENV === 'test' ? 'PRE_REGISTRATION_TEST' : 'PRE_REGISTRATION')
        .setFieldsRows([
//Figure this out
        ]).toParam();
}

/**
 *
 * @param msg {String} Message to write
 */
function writePiMessage(msg) {
    const query = squel.insert({autoQuoteTableNames: true, autoQuoteFieldNames: true})
        .into("PI_TEST")
        .setFieldsRows([
            {time: new Date().getTime(), message: msg}
        ])
        .toParam();
    query.text = query.text.concat(';');
    return new Promise((resolve, reject) => {
        connection.query(query.text, query.values, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(msg);
            }
        });
    });
}

module.exports = {
    getRegistrations,
    getPreRegistrations,
    addPreRegistration,
    writePiMessage,
};