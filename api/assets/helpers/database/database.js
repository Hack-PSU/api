const squel = require('squel');
const uuidv4 = require('uuid/v4');


/**
 *
 * @return {Stream} Return the list of all class in the database
 */
function getExtraCreditClassList(uow) {
  let query = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
    .from('EXTRA_CREDIT_CLASSES')
    .toString();
  query = query.concat(';');
  return uow.query(query, null, {stream: true});
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
 * @param user_agent {string} The user-agent field
 * @return Promise<any> {Promise<any>}
 */
function storeIP(uow, ipAddress, user_agent) {
  const query = squel.insert({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
    .into('REQ_DATA')
    .setFieldsRows([
      {
        idREQ_DATA: uuidv4(),
        req_time: new Date().getTime(),
        req_ip: ipAddress || '',
        req_user_agent: user_agent,
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
 * @param assignments
 * @param uow
 * @return {Promise<any>}
 */
function addRfidAssignments(assignments,uow) {
  const query = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
    .into('RFID_ASSIGNMENTS')
    .setFieldsRows(assignments)
    .toParam();
  query.text = query.text.concat(';');
  return uow.query(query.text, query.values);
}

/**
 *
 * @param scans
 * @param uow
 * @return {Promise<any>}
 */
function addRfidScans(scans, uow) {
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
    .from(
      squel.select(({ autoQuoteTableNames: true, autoQuoteFieldNames: true }))
          .from('REGISTRATION')
          .field('uid')
        .union(
          squel.select(({ autoQuoteTableNames: true, autoQuoteFieldNames: true }))
          .from('RSVP')
          .field('user_id')
        ).union(
          squel.select(({ autoQuoteTableNames: true, autoQuoteFieldNames: true }))
          .from('RFID_ASSIGNMENTS')
          .field('user_uid')
        ), 'a',
    )
    .left_join('REGISTRATION', 'r', 'a.uid = r.uid')
    .left_join('RSVP', 'v', 'a.uid = v.user_id')
    .left_join('RFID_ASSIGNMENTS', 'f', 'a.uid = f.user_uid')
    .left_join('PRE_REGISTRATION', 'p', 'r.email = p.email')
    .field('r.*')
    .field('p.id')
    .field('v.user_id')
    .field('f.user_uid')
    .toString();
  query = query.concat(';');
  return uow.query(query, null, {stream: true});
}

/**
 *
 * @param uow
 * @return {Promise<any>}
 */
function getAllUsersCount(uow) {
  let prereg_column_name = 'id';
  let reg_column_name = 'uid';
  let rsvp_column_name = 'user_id';
  let rfidscan_column_name = 'user_uid';
  let query = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: false })
    .from('PRE_REGISTRATION')
    .field('COUNT('+prereg_column_name+')', 'pre_count')
    .union(
      squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: false })
        .from('REGISTRATION')
        .field('COUNT('+reg_column_name+')', 'reg_count')
    ).union(
      squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: false })
        .from('RSVP')
        .field('COUNT('+rsvp_column_name+')', 'rsvp_count')
    ).union(
      squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: false })
        .from('RFID_ASSIGNMENTS')
        .field('COUNT('+rfidscan_column_name+')', 'rfidscan_count')
    )
    .toString();
  query = query.concat(';');
  //console.log('Users:' + query);
  return uow.query(query, null, {stream: true});
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
