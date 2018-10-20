// Collection of utility functions
import * as sendgrid from '@sendgrid/mail';
import * as validator from 'email-validator';
import * as request from 'request';
import * as Stringify from 'streaming-json-stringify';
import { Constants } from '../assets/constants/constants';
import { HttpError } from '../JSCommon/HttpError';

// TODO: Migrate these to either JSCommon/util or their own classes
sendgrid.setApiKey(Constants.SendGridApiKey);
/**
 * This function substitutes the provided
 * @param {String} html A string of HTML text that forms the body of the email. All substitutables must be formatted as $substitutable$. The HTML MUST contain the $NAME$ substitutable.
 * @param {String} name The name of the recipient
 * @param {Object} [substitutions] A map of strings with the following format { keyword-to-substitute: string-to-substitute-with, ... }; Example: { date: "09-23-2000" }
 * @return {Promise} return a promised data with a subbed version of the html
 */
export function emailSubstitute(html, name, substitutions) {
  return new Promise(((resolve, reject) => {
    let subbedHTML = name ? html.replace(/\$name\$/g, name) : html;
    for (const key in substitutions) {
      if (substitutions[key] && substitutions[key].length > 0 && key.length > 0) {
        subbedHTML = subbedHTML.replace(new RegExp(`\\$${key}\\$`, 'g'), substitutions[key]);
      } else {
        const error = new Error();
        error.message = 'One or more substitution keyword or substitution-text is empty';
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
export function sendEmail(data) {
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
export function createEmailRequest(email, htmlContent, subject, fromEmail) {
  const emailAddress = validator.validate(fromEmail) ? fromEmail : 'team@hackpsu.org';
  return {
    from: emailAddress,
    html: htmlContent,
    replyTo: emailAddress,
    subject,
    to: email,
  };
}

/**
 *
 * @param notificationTitle
 * @param notificationBody
 * @return {Promise<any>}
 */
export function sendNotification(notificationTitle, notificationBody) {
  return new Promise((resolve, reject) => {
    const headers = {
      Authorization: `Basic ${Constants.pushNotifKey.key}`,
      'Content-Type': 'application/json; charset=utf-8',
    };

    const data = {
      app_id: Constants.pushNotifKey.app_id,
      contents: { en: notificationBody.toString() },
      headings: { en: notificationTitle.toString() },
      included_segments: ['All'],
      url: 'https://app.hackpsu.org',
    };

    const options = {
      headers,
      json: data,
      method: 'POST',
      uri: 'https://onesignal.com/api/v1/notifications',
    };

    request(options, (err, response, body) => {
      if (body && body.errors && body.errors.length > 0) {
        reject(body.errors);
      } else {
        resolve(body);
      }
    });
  });
}

export function errorHandler500(err, handler) {
  const error = new HttpError(err.message || err, 500);
  handler(error);
}

export function standardErrorHandler(err, handler) {
  const error = new HttpError(err.message || err, err.status || 500);
  handler(error);
}

export function streamHandler(stream, res, next) {
  stream.pipe(Stringify())
    .pipe(res.type('json').status(200))
    .on('end', res.end)
    .on('error', err => errorHandler500(err, next));
}
