/* eslint-disable camelcase */
const Mailchimp = require('mailchimp-api-v3');
const crypto = require('crypto');
const { MailchimpApiKey } = require('../assets/constants/constants');

const mailchimp = Mailchimp(MailchimpApiKey);

module.exports.addSubscriber = (email_address, listId) => mailchimp.post(
  `/lists/${listId}/members`,
  {
    email_address,
    status: 'subscribed',
  },
);

module.exports.removeSubscriber = (email_id, listId) => mailchimp.patch(
  `lists/${listId}/members/${crypto.createHash('md5')
    .update(email_id)
    .digest('hex')}`,
  {
    status: 'unsubscribed',
  },
);

module.exports.getSubscriber = (email_id, listId) =>
  mailchimp.get(`lists/${listId}/members/${crypto.createHash('md5')
    .update(email_id)
    .digest('hex')}`);

module.exports.findList = name =>
  mailchimp.get('lists')
    .then(({ lists }) => lists.filter(({ listName }) => listName === name));
