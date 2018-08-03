/* eslint-disable max-len,func-names */
// Collection of utility functions
const validator = require('email-validator');
const request = require('request');
const Stringify = require('streaming-json-stringify');
const { pushNotifKey, SendGridApiKey } = require('../assets/constants/constants');
const sendgrid = require('@sendgrid/mail');


sendgrid.setApiKey(SendGridApiKey);
/**
 * This function substitutes the provided
 * @param {String} html A string of HTML text that forms the body of the email. All substitutables must be formatted as $substitutable$. The HTML MUST contain the $NAME$ substitutable.
 * @param {String} name The name of the recipient
 * @param {Object} [substitutions] A map of strings with the following format { keyword-to-substitute: string-to-substitute-with, ... }; Example: { date: "09-23-2000" }
 * @return {Promise} return a promised data with a subbed version of the html
 */
function emailSubstitute(html, name, substitutions) {
  return new Promise(((resolve, reject) => {
    let subbedHTML = name ? html.replace(/\$name\$/g, name) : html;
    for (const key in substitutions) {
      if (substitutions[key] && substitutions[key].length > 0 && key.length > 0) {
        subbedHTML = subbedHTML.replace(new RegExp(`\\$${key}\\$`, 'g'), substitutions[key]);
      } else {
        const error = new Error();
        error.body = { error: 'One or more substitution keyword or substitution-text is empty' };
        return reject(error);
      }
    }
    return resolve(subbedHTML);
  }));
}

/**
 * Makes the POST request to the email server URL
 * @param data Contains the options for the POST request. For schema, refer to function createEmailRequest or the SendInBlue API
 * @return {Promise}
 */
function sendEmail(data) {
  return sendgrid.send(data);
}


/* `from` - email address from which to send (required)
`subject` - string (required). Must be encoded as UTF-8
`message` - can be html (required). Must be encoded as UTF-8.
`altText` - plain text version of message. Must be encoded as UTF-8.
`to` - email address or array of addresses
`cc` - email address or array of addresses
`bcc` - email address or array of addresses
`replyTo` - email address
*/
/**
 * This generates the proper email send POST request format
 * @param {String} email The email ID to send the email to
 * @param {String} htmlContent HTML to be included in the email
 * @param {String} subject The subject of the email
 * @param {String} fromEmail
 * @return {Object} { data, options }
 */
function createEmailRequest(email, htmlContent, subject, fromEmail) {
  const emailAddress = validator.validate(fromEmail) ? fromEmail : 'team@hackpsu.org';
  return {
    to: email,
    from: emailAddress,
    subject,
    html: htmlContent,
    replyTo: emailAddress,
  };
}

/**
 *
 * @param notificationTitle
 * @param notificationBody
 * @return {Promise<any>}
 */
function sendNotification(notificationTitle, notificationBody) {
  return new Promise((resolve, reject) => {
    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: 'Basic '.concat(pushNotifKey.key),
    };

    const data = {
      app_id: pushNotifKey.app_id,
      contents: { en: notificationBody.toString() },
      headings: { en: notificationTitle.toString() },
      included_segments: ['All'],
      url: 'https://app.hackpsu.org',
    };

    const options = {
      uri: 'https://onesignal.com/api/v1/notifications',
      method: 'POST',
      headers,
      json: data,
    };

    request(options, (err, response, body) => {
      if (err) {
        reject(err);
      } else {
        resolve(body);
      }
    });
  });
}

function errorHandler500(err, handler) {
  const error = new Error();
  error.status = 500;
  error.body = err.message || err;
  handler(error);
}

function streamHandler(stream, res, next) {
  stream.pipe(Stringify())
    .pipe(res.type('json').status(200))
    .on('end', res.end)
    .on('error', err => errorHandler500(err, next));
}
module.exports = {
  errorHandler500,
  streamHandler,
  emailSubstitute,
  sendEmail,
  createEmailRequest,
  sendNotification,
};
