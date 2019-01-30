import * as crypto from 'crypto';
import mailchimpApiV3 = require('mailchimp-api-v3');
import { Constants } from '../../../assets/constants/constants';
import { IMailListService } from './email-list.service';

export class MailchimpService implements IMailListService {

  private readonly mailchimp;

  constructor(mailchimpApiKey?: string) {
    this.mailchimp = new mailchimpApiV3(mailchimpApiKey || Constants.MailchimpApiKey);
  }

  public addSubscriber(emailAddress: string, listId: string) {
    return this.mailchimp.post(
      `/lists/${listId}/members`,
      {
        email_address: emailAddress,
        status: 'subscribed',
      },
    );
  }

  public removeSubscriber(emaiId: string, listId: string) {
    return this.mailchimp.patch(
      `lists/${listId}/members/${crypto.createHash('md5')
        .update(emaiId)
        .digest('hex')}`,
      {
        status: 'unsubscribed',
      },
    );
  }

  public getSubscriber(emailId: string, listId: string) {
    return this.mailchimp.get(`lists/${listId}/members/${crypto.createHash('md5')
      .update(emailId)
      .digest('hex')}`);
  }

  public findList(listName: string) {
    return this.mailchimp.get('lists')
      .then(({ lists }) => Promise.resolve(lists.filter(({ name }) => name === listName)));
  }

}
