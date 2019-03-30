import * as fs from 'fs';
import { Inject, Injectable } from 'injection-js';
import * as path from 'path';
import request from 'request';
import { Constants } from '../assets/constants/constants';
import { UidType } from '../JSCommon/common-types';
import { IActiveHackathonDataMapper } from '../models/hackathon/active-hackathon';
import { IRegisterDataMapper } from '../models/register';
import { Registration } from '../models/register/registration';
import { ResponseBody } from '../router/router-types';
import { IEmailService } from '../services/communication/email';
import { IMailListService } from '../services/communication/email-list';
import { IEmailList } from '../services/communication/email-list/email-list.service';
import { IDbResult } from '../services/database';
import { IUowOpts } from '../services/database/svc/uow.service';
import { Logger } from '../services/logging/logging';

// TODO: Refactor this to retrieve email template from cloud storage?
const EMAIL_TEMPLATE_PATH = '../assets/emails/email_template.html';
const REGISTRATION_EMAIL_BODY = '../assets/emails/registration_body.html';
const emailTemplate = fs.readFileSync(path.join(__dirname, EMAIL_TEMPLATE_PATH), 'utf-8');
const registrationEmailBody = fs.readFileSync(
  path.join(__dirname, REGISTRATION_EMAIL_BODY),
  'utf-8',
);
const emailHtml = emailTemplate.replace('$$BODY$$', registrationEmailBody);

export interface IRegistrationProcessor {
  processRegistration(registration: Registration): Promise<ResponseBody>;

  getAllRegistrationsByUser(id: UidType, opts?: IUowOpts): Promise<ResponseBody>;

  normaliseRegistrationData(registration: any): void;
}

@Injectable()
export class RegistrationProcessor implements IRegistrationProcessor {

  constructor(
    @Inject('IRegisterDataMapper') private readonly registerDataMapper: IRegisterDataMapper,
    @Inject('IActiveHackathonDataMapper') private readonly hackathonDataMapper: IActiveHackathonDataMapper,
    @Inject('IEmailService') private readonly emailService: IEmailService,
    @Inject('IMailListService') private readonly mailListService: IMailListService,
    @Inject('BunyanLogger') private readonly logger: Logger,
  ) {}

  public async processRegistration(registration: Registration) {
    const result = await this.registerDataMapper.insert(registration);
    const submission = await this.registerDataMapper.submit(registration);
    try {
      const { data } = await this.registerDataMapper.getCurrent(registration.uid!);
      const hackathon = await this.hackathonDataMapper.activeHackathon.toPromise();
      await this.sendRegistrationEmail(data);
      await this.subscribeUserToMailingList(hackathon.name, data);
    } catch (error) {
      this.logger.error(error);
    }
    return new ResponseBody(
      'Success',
      200,
      { result: 'Success', data: registration },
    );
  }

  /**
   * @VisibleForTesting
   */
  public async sendRegistrationEmail(registration: Registration): Promise<[request.Response, {}]> {
    const substitutions = new Map<string, string>();
    substitutions.set('pin', registration.pin!.toString());
    const preparedHtml = await this.emailService.emailSubstitute(emailHtml, registration.firstname);
    const emailData = this.emailService.createEmailRequest(
      registration.email,
      preparedHtml,
      'Thank you for your Registration',
      '',
    );
    return this.emailService.sendEmail(emailData);
  }

  /**
   * @VisibleForTesting
   */
  public async subscribeUserToMailingList(name: string, registration: Registration) {
    const lists = await this.mailListService.findList(name);
    let list: IEmailList;
    if (lists.length > 0) {
      [list] = lists;
    } else {
      // Create the list first
      list = await this.mailListService.createList(
        {
          name,
          contact: Constants.Mailchimp.contact,
          permission_reminder: Constants.Mailchimp.permissionReminder,
          campaign_defaults: Constants.Mailchimp.campaignDefaultInformation,
          email_type_option: true,
        },
        ['pin', 'university', 'major'],
      );
    }
    return this.mailListService.addSubscriber(
      registration.email,
      list.id!,
      {
        PIN: registration.pin!.toString(),
        FNAME: registration.firstname,
        LNAME: registration.lastname,
        UNIVERSITY: registration.university,
        MAJOR: registration.major,
      },
    );
  }

  public normaliseRegistrationData(registration: any) {
    /** Converting boolean strings to booleans types in registration */
    registration.travelReimbursement = registration.travelReimbursement === true || registration.travelReimbursement === 'true';

    registration.firstHackathon = registration.firstHackathon === true || registration.firstHackathon === 'true';

    registration.eighteenBeforeEvent = registration.eighteenBeforeEvent === true || registration.eighteenBeforeEvent === 'true';

    registration.mlhcoc = registration.mlhcoc === true || registration.mlhcoc === 'true';

    registration.mlhdcp = registration.mlhdcp === true || registration.mlhdcp === 'true';
  }

  public async getAllRegistrationsByUser(id: UidType, opts?: IUowOpts): Promise<ResponseBody> {
    const hackathons = await this.hackathonDataMapper.getAll();
    const registrations = (await Promise.all(
      hackathons.data
        .map(
          hackathon => this.registerDataMapper
            .get({ uid: id, hackathon: hackathon.uid }, opts)
            .catch(() => undefined),
        ),
    ))
      .filter(a => a !== undefined)
      .map((result: IDbResult<Registration>) => result.data);
    return new ResponseBody(
      'Success',
      200,
      { result: 'Success', data: registrations },
    );
  }
}
