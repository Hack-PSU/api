/* eslint-disable max-len */
const constants = require('./constants');
const ses = require('node-ses');

const emailKey = require("../helpers/constants").emailKey;
const client = ses.createClient(emailKey);
/**
 * This function substitutes the provided
 * @param {String} html A string of HTML text that forms the body of the email. All substitutables must be formatted as $substitutable$. The HTML MUST contain the $NAME$ substitutable.
 * @param {String} name The name of the recipient
 * @param {Object} [substitutions] A map of strings with the following format { keyword-to-substitute: string-to-substitute-with, ... }; Example: { date: "09-23-2000" }
 * @return {String} HTML string with the words properly substituted
 */
module.exports.emailSubstitute = function emailSubstitute(html, name, substitutions) {
  let subbedHTML = html.replace(/\$name\$/g, name);
  let result;
  Object.entries(substitutions).forEach((substitution) => {
    if (substitution[1].length > 0 && substitution[0].length > 0){
      subbedHTML = subbedHTML.replace(new RegExp(`\\$${substitution[0]}\\$`, 'g'), substitution[1]);
    }
    else{
      const status = false;
      result = false;
    }
  });
  return {subbedHTML, result};
};

/**
 * Makes the POST request to the email server URL
 * @param data Contains the options for the POST request. For schema, refer to function createEmailRequest or the SendInBlue API
 * @return {Promise<any>}
 */
module.exports.sendEmail = function sendEmail(data) {
  return new Promise((resolve, reject) => {
    client.sendEmail(data, function (err) {
      if (err) {
        reject(err);
      }
      else resolve(true);
    });
  });
};


/*`from` - email address from which to send (required)
`subject` - string (required). Must be encoded as UTF-8
`message` - can be html (required). Must be encoded as UTF-8.
`altText` - plain text version of message. Must be encoded as UTF-8.
`to` - email address or array of addresses
`cc` - email address or array of addresses
`bcc` - email address or array of addresses
`replyTo` - email address
/**
 * This generates the proper email send POST request format
 * @param {String} email The email ID to send the email to
 * @param {String} htmlContent HTML to be included in the email
 * @param {String} subject The subject of the email
 * @param {String} name The name of the recipient
 * @return {Object} { data, options }
 */
module.exports.createEmailRequest = function createEmailRequest(email, htmlContent, subject) {
  const data = {
    to: email, 
    from: 'technology@hackpsu.org',
    subject: subject, 
    message: htmlContent,
    replyTo: 'team@hackpsu.org'
    };
  return {
    data,
  };
};
