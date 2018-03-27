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
    .from(process.env.NODE_ENV === 'test' ? 'REGISTRATION_TEST' : 'REGISTRATION')
    .limit(mLimit ? mLimit : null)
    .offset(mOffset ? mOffset : null)
    .toString()
    .concat(';');
  return connection.query(query).stream();
}

/**
 *
 * @param uid {string} The uid of the user to retrieve the registration for
 * @return {Stream} Returns a continuous stream of data from the database
 */
function getRegistration(uid) {
  const query = squel.select({autoQuoteTableNames: true, autoQuoteFieldNames: true})
    .from(process.env.NODE_ENV === 'test' ? 'REGISTRATION_TEST' : 'REGISTRATION')
    .where('uid = ?', uid)
    .toParam();
  query.text = query.text.concat(';');
  return connection.query(query.text, query.values).stream();
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
    .from('PRE_REGISTRATION')
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


/**
 *
 * @param uid {string} UID of the user to set registration submission status
 */
function setRegistrationSubmitted(uid) {
  const dbname = process.env.NODE_ENV === 'test' ? 'REGISTRATION_TEST' : 'REGISTRATION';
  const query = squel.update({autoQuoteTableNames: true, autoQuoteFieldNames: true})
    .table(dbname)
    .set('submitted', true)
    .where("uid = ?", uid)
    .toParam();
  query.text = query.text.concat(';');
  connection.query(query.text, query.values);
}


/**
 *
 * @param data {Object} Data format that matches the registeredUserSchema
 * @return {Promise<any>}
 */
function addRegistration(data) {
  const query = squel.insert({autoQuoteTableNames: true, autoQuoteFieldNames: true})
    .into(process.env.NODE_ENV === 'test' ? 'REGISTRATION_TEST' : 'REGISTRATION')
    .setFieldsRows([
      data
    ]).toParam();
  query.text = query.text.concat(';');
  return new Promise((resolve, reject) => {
    connection.query(query.text, query.values, (err, result) => {
      if (err && err.errno === 1062) {
        const error = new Error();
        error.message = "User already registered";
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

/**
 *
 * @param uid {string} UID of the user to set the RSVP status
 * @param RSVPstatus
 */
function setRSVP(uid, RSVPstatus) {
  const dbname = process.env.NODE_ENV === 'test' ? 'RSVP_TEST' : 'RSVP';
  const query = squel.insert({autoQuoteTableNames: true, autoQuoteFieldNames: true})
    .into(dbname)
    .setFieldRows([{isRSVP: uid, rsvp_time: newDate().getTime(), rsvp_status: RSVPstatus}])
    .toParam();
  query.text = query.text.concat(';');
  return new Promise((resolve, reject) => {
    connection.query(query.text, query.values, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 *
 * @param uid {string} UID of the user to get the RSVP status
 * @return {Promise<any>}
 */
function getRSVP(uid) {
  const dbname = process.env.NODE_ENV === 'test' ? 'RSVP_TEST' : 'RSVP';
  const query = squel.select({autoQuoteTableNames: true, autoQuoteFieldNames: true})
    .from(dbname)
    .where("idRSVP = ?", uid)
    .toParam();
  query.text = query.text.concat(';');
  return new Promise((resolve, reject) => {
    connection.query(query.text, query.values, (err, response) => {
      if (err) {
        reject(err);
      } else {
        resolve(response);
      }
    })
  })
}

/**
 * @param limit {Number} Limit the number of rows to retrieve
 * @param offset {Number} Offset from start to retrieve at
 * @return {Stream} Returns a continuous stream of data of people who RSVP
 */
function getRSVPList(limit, offset) {
  const mLimit = parseInt(limit);
  const mOffset = parseInt(offset);
  const query = squel.select({autoQuoteTableNames: true, autoQuoteFieldNames: true})
    .from('RSVP')
    .where('rsvp_status = ?', true)
    .limit(mLimit ? limit : null)
    .offset(mOffset ? offset : null)
    .toString().concat(';');
  return connection.query(query).stream();
}


/**
 *
 * @param uid {string} get email associated with the uid
 *
 **/
function getEmail(uid) {
  const dbname = process.env.NODE_ENV === 'test' ? 'REGISTRATION_TEST' : 'REGISTRATION';
  const query = squel.select({autoQuoteTableNames: true, autoQuoteFieldNames: true})
    .from(dbname)
    .field('email')
    .where("uid = ?", uid)
    .toString()
    .concat(';');
  return new Promise((resolve, reject) => {
    connection.query(query, (err, response) => {
      if (err) {
        reject(err);
      } else {
        resolve(response);
      }
    })
  })
}

/**
 *
 * @param msg {String} Message to write
 */
function writePiMessage(msg) {
  const query = squel.insert({autoQuoteTableNames: true, autoQuoteFieldNames: true})
    .into('PI_TEST')
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

/**
 *
 * @param ipAddress {string} The IP Address to store
 * @param user_agent {string} The user-agent field
 * @return Promise<any> {Promise<any>}
 */
function storeIP(ipAddress, user_agent) {
  const query = squel.insert({autoQuoteTableNames: true, autoQuoteFieldNames: true})
    .into('REQ_DATA')
    .setFieldsRows([
      {
        idREQ_DATA: uuidv4(),
        req_time: new Date().getTime(),
        req_ip: ipAddress ? ipAddress : "",
        req_user_agent: user_agent
      }
    ])
    .toParam();
  query.text = query.text.concat(';');
  return new Promise((resolve) => {
    connection.query(query.text, query.values, () => {
      resolve();
    });
  });
}


module.exports = {
  getRegistrations,
  getRegistration,
  getPreRegistrations,
  addPreRegistration,
  writePiMessage,
  addRegistration,
  setRegistrationSubmitted,
  storeIP,
  getRSVP,
  setRSVP,
  getEmail,
};