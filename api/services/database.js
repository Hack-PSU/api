const squel = require('squel');
const uuidv4 = require('uuid/v4');
const Hackathon = require('../models/Hackathon');
const PreRegistration = require('../models/PreRegistration');
const Registration = require('../models/Registration');
const RSVP = require('../models/RSVP');

/**
 * Returns a list of extra credit classes available.
 * @return {Promise<Stream>} Return the list of all class in the database
 */
function getExtraCreditClassList(uow) {
  let query = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
    .from('EXTRA_CREDIT_CLASSES')
    .toString();
  query = query.concat(';');
  return uow.query(query, null, { stream: true });
}

/**
 *
 * @param uow
 * @param uid - id of the hacker
 * @param cid - id of the class
 */
function assignExtraCredit(uow, uid, cid) {
  const query = squel.insert({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
    .into('EXTRA_CREDIT_ASSIGNMENT')
    .setFieldsRows([{ class_uid: cid, user_uid: uid }])
    .toParam();
  query.text = query.text.concat(';');
  return uow.query(query.text, query.values);
}

/**
 *
 * @param uow
 * @param msg {String} Message to write
 */
function writePiMessage(uow, msg) {
  const query = squel.insert({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
    .into('PI_TEST')
    .setFieldsRows([
      { time: new Date().getTime(), message: msg },
    ])
    .toParam();
  query.text = query.text.concat(';');
  return uow.query(query.text, query.values);
}

/**
 *
 * @param ipAddress {string} The IP Address to store
 * @param userAgent {string} The user-agent field
 * @return Promise<any> {Promise<any>}
 */
function storeIP(uow, ipAddress, userAgent) {
  const query = squel.insert({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
    .into('REQ_DATA')
    .setFieldsRows([
      {
        idREQ_DATA: uuidv4(),
        req_time: new Date().getTime(),
        req_ip: ipAddress || '',
        req_user_agent: userAgent,
      },
    ])
    .toParam();
  query.text = query.text.concat(';');
  return uow.query(query.text, query.values);
}

/**
 *
 * @param successes
 * @param fails
 * @return {Promise<any>}
 */
function addEmailsHistory(uow, successes, fails) {
  const mSuccesses = successes.map((s) => {
    s.status = '200';
    return s;
  });
  if (fails) {
    fails.forEach((f) => {
      f.status = '207';
      mSuccesses.push(f);
    });
  }
  const query = squel.insert({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
    .into('EMAIL_HISTORY')
    .setFieldsRows(mSuccesses)
    .toParam();
  return uow.query(query.text, query.values);
}

/**
 *
 * @param uow
 * @param assignments
 * @return {Promise<any[]>}
 */
function addRfidAssignments(uow, assignments) {
  const promises = assignments.map((assignment) => {
    const insertAssignment = {
      rfid_uid: assignment.rfid,
      user_uid: assignment.uid,
      time: assignment.time,
      hackathon: Hackathon.Hackathon.getActiveHackathonQuery(),
    };
    const query = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into('RFID_ASSIGNMENTS')
      .setFields(insertAssignment)
      .toParam();
    return uow.query(query.text, query.values)
      .then(() => uow.commit())
      .catch(error => error);
  });
  return Promise.all(promises);
}

/**
 *
 * @param uow
 * @param scans
 * @return {Promise<any[]>}
 */
// TODO: Possibly migrate to Scans model?
function addRfidScans(uow, scans) {
  const promises = scans.map((scan) => {
    scan.hackathon = Hackathon.Hackathon.getActiveHackathonQuery();
    const query = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into('SCANS')
      .setFields(scan)
      .toParam();
    query.text = query.text.concat(';');
    return uow.query(query.text, query.values)
      .then(() => uow.commit())
      .catch(error => error);
  });
  return Promise.all(promises);
}

/**
 *
 * @param uow
 * @return {Promise<any>}
 */
function getAllUsersList(uow) {
  let query = squel.select({ autoQuoteFieldNames: false, autoQuoteTableNames: true })
    .field('pre_reg.uid', 'pre_uid')
    .field('reg.*')
    .field('reg.pin - hackathon.base_pin', 'pin')
    .field('hackathon.name')
    .field('hackathon.start_time')
    .field('hackathon.end_time')
    .field('hackathon.base_pin')
    .field('hackathon.active')
    .field('rsvp.user_id')
    .field('rsvp.rsvp_time')
    .field('rsvp.rsvp_status')
    .field('rfid.user_uid')
    .from(PreRegistration.TABLE_NAME, 'pre_reg')
    .right_join(Registration.TABLE_NAME, 'reg', 'pre_reg.email = reg.email')
    .join(Hackathon.TABLE_NAME, 'hackathon', 'reg.hackathon = hackathon.uid and hackathon.active = 1')
    .left_join(RSVP.TABLE_NAME, 'rsvp', 'reg.uid = rsvp.user_id AND rsvp.hackathon = hackathon.uid')
    .left_join('RFID_ASSIGNMENTS', 'rfid', 'reg.uid = rfid.user_uid AND hackathon.uid = rfid.hackathon')
    .toString();
  query = query.concat(';');
  return uow.query(query, null, { stream: true });
}

/**
 *
 * @param uow
 * @return {Promise<any>}
 */
function getAllUsersCount(uow) {
  let query = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
    .from(squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: false })
      .from(PreRegistration.TABLE_NAME, 'prereg')
      .field('COUNT(prereg.uid)', 'pre_count')
      .join(Hackathon.TABLE_NAME, 'hackathon', 'hackathon.uid = prereg.hackathon AND hackathon.active = 1'), 'a')
    .join(squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: false })
      .from(Registration.TABLE_NAME, 'registration')
      .field('COUNT(registration.uid)', 'reg_count')
      .join(Hackathon.TABLE_NAME, 'hackathon', 'hackathon.uid = registration.hackathon AND hackathon.active = 1'), 'b')
    .join(squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: false })
      .from(RSVP.TABLE_NAME, 'rsvp')
      .field('COUNT(rsvp.user_id)', 'rsvp_count')
      .join(Hackathon.TABLE_NAME, 'hackathon', 'hackathon.uid = rsvp.hackathon AND hackathon.active = 1'), 'c')
    .join(squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: false })
      .from('RFID_ASSIGNMENTS', 'rfid')
      .field('COUNT(rfid.user_uid)', 'checkin_count')
      .join(Hackathon.TABLE_NAME, 'hackathon', 'hackathon.uid = rfid.hackathon AND hackathon.active = 1'), 'd')
    .toString();
  query = query.concat(';');
  return uow.query(query, null, { stream: false });
}

module.exports = {
  writePiMessage,
  getExtraCreditClassList,
  addRfidAssignments,
  addRfidScans,
  assignExtraCredit,
  storeIP,
  addEmailsHistory,
  getAllUsersList,
  getAllUsersCount,
};
