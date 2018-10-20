/* eslint-disable camelcase */
import * as crypto from 'crypto';
import Mailchimp = require('mailchimp-api-v3');
import { Constants } from '../assets/constants/constants';

const mailchimp = new Mailchimp(Constants.MailchimpApiKey);

// TODO: Make class
export function addSubscriber(emailAddress, listId) {
  return mailchimp.post(
    `/lists/${listId}/members`,
    {
      email_address: emailAddress,
      status: 'subscribed',
    },
  );
}

export function removeSubscriber(emaiId, listId){
  return mailchimp.patch(
    `lists/${listId}/members/${crypto.createHash('md5')
      .update(emaiId)
      .digest('hex')}`,
    {
      status: 'unsubscribed',
    },
  );
}

export function getSubscriber(emailId, listId) {
  return mailchimp.get(`lists/${listId}/members/${crypto.createHash('md5')
    .update(emailId)
    .digest('hex')}`);
}

export function findList(listName) {
  return mailchimp.get('lists')
    .then(({ lists }) => Promise.resolve(lists.filter(({ name }) => name === listName)));
}
