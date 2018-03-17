const squel = require('squel');
const sql = require('mysql');
const uuidv4 = require('uuid/v4');
const Timeuuid = require('node-time-uuid');

const sqlOptions = require('./constants').sqlConnection;
const EventModel = require('../models/EventModel');

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
  const mLimit = parseInt(limit, 10);
  const mOffset = parseInt(offset, 10);
  const query = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
    .from(process.env.NODE_ENV === 'test' ? 'REGISTRATION_TEST' : 'REGISTRATION')
    .limit(mLimit || null)
    .offset(mOffset || null)
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
  const query = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
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
  const mLimit = parseInt(limit, 10);
  const mOffset = parseInt(offset, 10);
  const query = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
    .from('PRE_REGISTRATION')
    .limit(mLimit ? limit : null)
    .offset(mOffset ? offset : null)
    .toString()
    .concat(';');
  return connection.query(query).stream();
}

/**
 *
 * @param email {String} the email
 * @return {Promise<any>}
 */
function addPreRegistration(email) {
  const query = squel.insert({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
    .into(process.env.NODE_ENV === 'test' ? 'PRE_REGISTRATION_TEST' : 'PRE_REGISTRATION')
    .setFieldsRows([
      { id: uuidv4().replace(/-/g, ''), email },
    ])
    .toParam();
  query.text = query.text.concat(';');
  return new Promise((resolve, reject) => {
    connection.query(query.text, query.values, (err, result) => {
      if (err && err.errno === 1062) {
        const error = new Error();
        error.message = 'Email already provided';
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
  const query = squel.update({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
    .table(dbname)
    .set('submitted', true)
    .where('uid = ?', uid)
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
  const query = squel.insert({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
    .into(process.env.NODE_ENV === 'test' ? 'REGISTRATION_TEST' : 'REGISTRATION')
    .setFieldsRows([
      data,
    ]).toParam();
  query.text = query.text.concat(';');
  return new Promise((resolve, reject) => {
    connection.query(query.text, query.values, (err, result) => {
      if (err && err.errno === 1062) {
        const error = new Error();
        error.message = 'User already registered';
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
 * @param msg {String} Message to write
 */
function writePiMessage(msg) {
  const query = squel.insert({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
    .into('PI_TEST')
    .setFieldsRows([
      { time: new Date().getTime(), message: msg },
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
 * @param userAgent {string} The user-agent field
 * @return Promise<any> {Promise<any>}
 */
function storeIP(ipAddress, userAgent) {
  const query = squel.insert({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
    .into('REQ_DATA')
    .setFieldsRows([
      {
        idREQ_DATA: uuidv4(), req_time: new Date().getTime(), req_ip: ipAddress || '', req_user_agent: userAgent,
      },
    ])
    .toParam();
  query.text = query.text.concat(';');
  return new Promise((resolve) => {
    connection.query(query.text, query.values, () => {
      resolve();
    });
  });
}

/**
 * @return {Promise} Returns all the data from the database
 */
function getCurrentUpdates() {
  let query = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
    .from('LIVE_UPDATES')
    .order('idLIVE_UPDATES')
    .toString();
  query = query.concat(';');
  return new Promise((resolve, reject) => {
    connection.query(query, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

/**
 *
 * @param updateText {string}
 * @param updateImage {string}
 * @param updateTitle
 * @return {Promise<any>}
 */
function addNewUpdate(updateText, updateImage, updateTitle) {
  const insertObj = {
    uid: new Timeuuid().toString('hex'), update_text: updateText, update_image: updateImage, update_title: updateTitle,
  };
  const query = squel.insert({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
    .into('LIVE_UPDATES')
    .setFieldsRows([insertObj]).toParam();
  query.text = query.text.concat(';');
  return new Promise((resolve, reject) => {
    connection.query(query.text, query.values, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(insertObj);
      }
    });
  });
}

function createEvent(a) {
  a(); // TODO:Fill in
}

/**
 * @return {Promise<EventModel>} Stream of event data
 */
function getCurrentEvents() {
  const query = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
    .from('EVENTS', 'e')
    .field('e.*')
    .field('l.location_name',)
    .order('event_start_time', true)
    .join('LOCATIONS', 'l', 'event_location=l.uid')
    .toString()
    .concat(';');
  return new Promise((resolve, reject) => {
    connection.query(query, (err, response) => {
      if (err) {
        reject(err);
      } else {
        resolve(response);
      }
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
  getCurrentUpdates,
  addNewUpdate,
  createEvent,
  getCurrentEvents
};
