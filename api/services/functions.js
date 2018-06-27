/* eslint-disable max-len,func-names */
// Collection of utility functions
const ses = require('node-ses');
const validator = require('email-validator');
const request = require('request');

const { emailKey, pushNotifKey } = require('../assets/helpers/constants/constants');

const client = ses.createClient(emailKey);
/**
 * This function substitutes the provided
 * @param {String} html A string of HTML text that forms the body of the email. All substitutables must be formatted as $substitutable$. The HTML MUST contain the $NAME$ substitutable.
 * @param {String} name The name of the recipient
 * @param {Object} [substitutions] A map of strings with the following format { keyword-to-substitute: string-to-substitute-with, ... }; Example: { date: "09-23-2000" }
 * @return {Promise} return a promised data with a subbed version of the html
 */
module.exports.emailSubstitute = function (html, name, substitutions) {
  return new Promise(((resolve, reject) => {
    let subbedHTML = name ? html.replace(/\$name\$/g, name) : html;
    for (const key in substitutions) {
      if (substitutions[key].length > 0 && key.length > 0) {
        subbedHTML = subbedHTML.replace(new RegExp(`\\$${key}\\$`, 'g'), substitutions[key]);
      } else {
        const error = new Error();
        error.body = { error: 'One or more substitution keyword or substitution-text is empty' };
        reject(error);
      }
    }
    resolve(subbedHTML);
  }));
};

/**
 * Makes the POST request to the email server URL
 * @param data Contains the options for the POST request. For schema, refer to function createEmailRequest or the SendInBlue API
 * @return {Promise<any>}
 */
module.exports.sendEmail = function (data) {
  return new Promise((resolve, reject) => {
    client.sendEmail(data, (err) => {
      if (err) {
        reject(err);
      } else resolve(data);
    });
  });
};


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
module.exports.createEmailRequest = function (email, htmlContent, subject, fromEmail) {
  const emailAddress = validator.validate(fromEmail) ? fromEmail : 'team@hackpsu.org';
  const data = {
    to: email,
    from: emailAddress,
    subject,
    message: htmlContent,
    replyTo: emailAddress,
  };
  return {
    data,
  };
};

/**
 *
 * @param notificationTitle
 * @param notificationBody
 * @return {Promise<any>}
 */
module.exports.sendNotification = function (notificationTitle, notificationBody) {
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
};

module.exports.errorHandler500 = function (err, handler) {
  const error = new Error();
  error.status = 500;
  error.body = err.message;
  handler(error);
};
