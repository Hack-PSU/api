import { expect } from 'chai';
import 'mocha';
import { of } from 'rxjs';
import { anything, capture, instance, mock, reset, verify, when } from 'ts-mockito';
import { ActiveHackathonDataMapperImpl } from '../../src/models/hackathon/active-hackathon';
import { ActiveHackathon } from '../../src/models/hackathon/active-hackathon/active-hackathon';
import { RegisterDataMapperImpl } from '../../src/models/register/register-data-mapper-impl';
import {
  AcademicYear,
  CodingExperience,
  Gender,
  Registration,
  ShirtSize,
  VeteranOptions,
} from '../../src/models/register/registration';
import { RegistrationProcessor } from '../../src/processors/registration-processor';
import { IEmailList } from '../../src/services/communication/email-list/email-list.service';
import { MailchimpService } from '../../src/services/communication/email-list/mailchimp.service';
import { SendgridService } from '../../src/services/communication/email/sendgrid.service';
import { Logger } from '../../src/services/logging/logging';

// Global mocks
const registrationDMMock = mock(RegisterDataMapperImpl);
const sendgridServiceMock = mock(SendgridService);
const mailListServiceMock = mock(MailchimpService);
const hackathonDMMock = mock(ActiveHackathonDataMapperImpl);

let registrationDataMapper: RegisterDataMapperImpl;
let emailService: SendgridService;
let mailListService: MailchimpService;
let hackathonDataMapper: ActiveHackathonDataMapperImpl;
const registration = new Registration({
  academicYear: AcademicYear.FRESHMAN,
  allergies: null,
  codingExperience: CodingExperience.NONE,
  dietaryRestriction: null,
  eighteenBeforeEvent: true,
  email: 'test@email.com',
  ethnicity: 'test ethnicity',
  expectations: 'test expectations',
  firstHackathon: true,
  firstName: 'test first name',
  gender: Gender.NODISCLOSE,
  lastName: 'test last name',
  major: 'test major',
  mlhcoc: true,
  mlhdcp: true,
  phone: '1234567890',
  projectDesc: 'test description',
  referral: 'test referral',
  resume: null,
  shirtSize: ShirtSize.MEDIUM,
  travelReimbursement: false,
  uid: 'test uid',
  university: 'test university',
  veteran: VeteranOptions.NODISCLOSE,
  time: Date.now(),
  submitted: true,
});
registration.pin = 0;

describe('TEST: Registration Processor', () => {
  beforeEach(() => {
    registrationDataMapper = instance(registrationDMMock);
    hackathonDataMapper = instance(hackathonDMMock);
    emailService = instance(sendgridServiceMock);
    mailListService = instance(mailListServiceMock);
  });

  afterEach(() => {
    reset(registrationDMMock);
    reset(sendgridServiceMock);
    reset(mailListServiceMock);
  });
  describe('TEST: Process Registration', () => {
    it('it processes a valid registration', async () => {
      when(registrationDMMock.getCurrent(anything()))
        .thenResolve({ result: 'Success', data: registration });
      // hackathonDataMapper.activeHackathon =
      when(hackathonDMMock.activeHackathon)
        .thenReturn(of(new ActiveHackathon({
          name: 'test',
          uid: 'test uid',
          startTime: Date.now(),
          endTime: null,
          basePin: null,
        }),
        ));
      when(mailListServiceMock.findList(anything())).thenResolve([]);
      when(mailListServiceMock.createList(anything(), anything()))
        .thenResolve({ id: 'test id' } as any as IEmailList);
      mailListService = instance(mailListServiceMock);
      registrationDataMapper = instance(registrationDMMock);
      hackathonDataMapper = instance(hackathonDMMock);
      // GIVEN: A registration processor
      const registrationProcessor = new RegistrationProcessor(
        registrationDataMapper,
        hackathonDataMapper,
        emailService,
        mailListService,
        new Logger(),
      );
      // WHEN: Processing the registration
      await registrationProcessor.processRegistration(registration);
      // THEN: Registration was inserted
      verify(registrationDMMock.insert(registration)).once();
      // THEN: Registration was submitted
      verify(registrationDMMock.submit(registration)).once();
      // THEN: Confirmation email was sent
      verify(sendgridServiceMock.sendEmail(anything())).once();
      // THEN: Subscriber was added
      verify(mailListServiceMock.addSubscriber(anything(), anything(), anything())).once();
    });
  });

  describe('TEST: Send email after registration', () => {
    it('it sends a confirmation email', async () => {
      // GIVEN: A registration processor
      const registrationProcessor = new RegistrationProcessor(
        registrationDataMapper,
        hackathonDataMapper,
        emailService,
        mailListService,
        new Logger(),
      );
      // WHEN: Sending the confirmation email
      await registrationProcessor.sendRegistrationEmail(registration);
      // THEN: Generates the substituted HTML
      verify(sendgridServiceMock.emailSubstitute(anything(), registration.firstname)).once();
      // THEN: Email request matches expectation
      const [toEmail, _, subject] = capture(sendgridServiceMock.createEmailRequest).first();
      expect(toEmail).to.equal(registration.email);
      expect(subject).to.equal('Thank you for your Registration');
      // THEN: Sends the email
      verify(sendgridServiceMock.sendEmail(anything())).once();
    });
  });

  describe('TEST: Add subscriber after registration', () => {
    it('it adds a mailchimp subscriber when list exists', async () => {
      // GIVEN: A subscriber list exists
      when(mailListServiceMock.findList(anything())).thenResolve([{ id: 'test list' }]);
      mailListService = instance(mailListServiceMock);
      // GIVEN: A registration processor
      const registrationProcessor = new RegistrationProcessor(
        registrationDataMapper,
        hackathonDataMapper,
        emailService,
        mailListService,
        new Logger(),
      );
      // WHEN: Adding a subscriber
      await registrationProcessor.subscribeUserToMailingList('test list', registration);
      // THEN: A subscriber is added
      verify(mailListServiceMock.addSubscriber(
        registration.email,
        'test list',
        anything(),
      )).once();
    });

    it('it adds a mailchimp subscriber when list does not', async () => {
      // GIVEN: A subscriber list exists
      when(mailListServiceMock.findList(anything())).thenResolve([]);
      when(mailListServiceMock.createList(anything(), anything()))
        .thenResolve({ id: 'test id' } as any as IEmailList);
      mailListService = instance(mailListServiceMock);
      // GIVEN: A registration processor
      const registrationProcessor = new RegistrationProcessor(
        registrationDataMapper,
        hackathonDataMapper,
        emailService,
        mailListService,
        new Logger(),
      );
      // WHEN: Adding a subscriber
      await registrationProcessor.subscribeUserToMailingList('test list', registration);
      // THEN: List is created
      verify(mailListServiceMock.createList(
        anything(),
        anything(),
      )).once();
      // THEN: A subscriber is added
      verify(mailListServiceMock.addSubscriber(
        registration.email,
        anything(),
        anything(),
      )).once();
    });
  });
});
