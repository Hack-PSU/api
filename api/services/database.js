const squel = require('squel');
const uuidv4 = require('uuid/v4');
const Hackathon = require('../models/Hackathon');


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
 * @return {Promise<any>}
 */
function addRfidAssignments(uow, assignments) {
  const query = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
    .into('RFID_ASSIGNMENTS')
    .setFieldsRows(assignments)
    .toParam();
  query.text = query.text.concat(';');
  return uow.query(query.text, query.values);
}

/**
 *
 * @param uow
 * @param scans
 * @return {Promise<any>}
 */
// TODO: Possibly migrate to Scans model?
function addRfidScans(uow, scans) {
  const query = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
    .into('RFID_SCANS')
    .setFieldsRows(scans)
    .toParam();
  query.text = query.text.concat(';');
  return uow.query(query.text, query.values);
}

/**
 *
 * @param uow
 * @return {Promise<any>}
 */
function getAllUsersList(uow) {
  let query = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
    .from(squel.select(({ autoQuoteTableNames: true, autoQuoteFieldNames: true }))
      .from('REGISTRATION', 'r')
      .field('r.uid')
      .join(Hackathon.TABLE_NAME, 'h', 'r.hackathon = h.uid and h.active = 1')
      .union(squel.select(({ autoQuoteTableNames: true, autoQuoteFieldNames: true }))
        .from('RSVP', 'rsvp')
        .field('rsvp.user_id')
        .join(Hackathon.TABLE_NAME, 'h', 'rsvp.hackathon = h.uid and h.active = 1'))
      .union(squel.select(({ autoQuoteTableNames: true, autoQuoteFieldNames: true }))
        .from('RFID_ASSIGNMENTS', 'rfid')
        .field('rfid.user_uid')
        .join(Hackathon.TABLE_NAME, 'h', 'rfid.hackathon = h.uid and h.active = 1')), 'a')
    .left_join('REGISTRATION', 'r', 'a.uid = r.uid')
    .left_join('RSVP', 'v', 'a.uid = v.user_id')
    .left_join('RFID_ASSIGNMENTS', 'f', 'a.uid = f.user_uid')
    .left_join('PRE_REGISTRATION', 'p', 'r.email = p.email')
    .field('r.*')
    .field(`r.pin - (${squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from(Hackathon.TABLE_NAME, 'h')
      .where('active = 1')
      .toString()})`, 'pin')
    .field('p.uid', 'pre_uid')
    .field('v.user_id')
    .field('f.user_uid')
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
  const preregColumnName = 'p.uid';
  const reg_column_name = 'r.uid';
  const rsvp_column_name = 'rsvp.user_id';
  const rfidscan_column_name = 'rfid.user_uid';
  let query = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: false })
    .from('PRE_REGISTRATION', 'p')
    .field(`COUNT(${preregColumnName})`, 'pre_count')
    .join(Hackathon.TABLE_NAME, 'h', 'p.hackathon = h.uid AND h.active = 1')
    .union(squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: false })
      .from('REGISTRATION', 'r')
      .field(`COUNT(${reg_column_name})`, 'reg_count')
      .join(Hackathon.TABLE_NAME, 'h', 'r.hackathon = h.uid AND h.active = 1'))
    .union(squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: false })
      .from('RSVP', 'rsvp')
      .field(`COUNT(${rsvp_column_name})`, 'rsvp_count')
      .join(Hackathon.TABLE_NAME, 'h', 'rsvp.hackathon = h.uid AND h.active = 1'))
    .union(squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: false })
      .from('RFID_ASSIGNMENTS', 'rfid')
      .field(`COUNT(${rfidscan_column_name})`, 'rfidscan_count')
      .join(Hackathon.TABLE_NAME, 'h', 'rfid.hackathon = h.uid AND h.active = 1'))
    .toString();
  query = query.concat(';');
  return uow.query(query, null, { stream: true });
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
