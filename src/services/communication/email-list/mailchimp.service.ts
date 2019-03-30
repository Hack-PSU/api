import * as crypto from 'crypto';
import { Inject, Injectable } from 'injection-js';
// tslint:disable:import-name
// @tst-ignore:import-name
import Mailchimp from 'mailchimp-api-v3';
import { Constants } from '../../../assets/constants/constants';
import { Logger } from '../../logging/logging';
import { IEmailList, IMailListService } from './email-list.service';

@Injectable()
export class MailchimpService implements IMailListService {

  private readonly mailchimp: Mailchimp;

  constructor(
    @Inject('BunyanLogger') private readonly logger: Logger,
  ) {
    this.mailchimp = new Mailchimp(Constants.Mailchimp.apiKey);
  }

  public addSubscriber(emailAddress: string, listId: string, other_fields?: any) {
    return this.mailchimp.post(
      `/lists/${listId}/members`,
      {
        email_address: emailAddress,
        status: 'subscribed',
        merge_fields: other_fields,
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
      .then(({ lists }: { lists: any[] }) => Promise.resolve(lists.filter(({ name }) => name === listName)));
  }

  public async createList(list: IEmailList, mergeFields?: string[]): Promise<IEmailList> {
    const returnedList: IEmailList = await this.mailchimp.post('lists', list);
    // Add custom fields
    if (mergeFields) {
      for (let i = 0; i < mergeFields.length; i += 1) {
        const name = mergeFields[i];
        try {
          await this.mailchimp.post(
            `lists/${returnedList.id}/merge-fields`,
            {
              name,
              tag: name.toUpperCase(),
              type: 'text',
              required: true,
              default_value: '',
              public: true,
              display_order: i,
              options: {
                default_country: 0,
                phone_format: 'US',
                date_format: 'MM/DD/YYYY',
                choices: [],
                size: 15,
              },
              help_text: name,
            },
          );
        } catch (error) {
          this.logger.error(error);
        }
      }
    }
    return returnedList;
  }

}
