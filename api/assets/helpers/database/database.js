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
    .into(process.env.NODE_ENV === 'test' ? 'EXTRA_CREDIT_ASSIGNMENT_TEST' : 'EXTRA_CREDIT_ASSIGNMENT')
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


module.exports = {
  writePiMessage,
  getExtraCreditClassList,
  assignExtraCredit,
  storeIP,
  addEmailsHistory,
};
