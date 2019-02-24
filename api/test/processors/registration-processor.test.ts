import { expect } from 'chai';
import 'mocha';
import { anything, capture, instance, mock, reset, verify } from 'ts-mockito';
import {
  AcademicYear,
  CodingExperience,
  Gender,
  RegisterDataMapperImpl,
  Registration,
  ShirtSize,
  VeteranOptions,
} from '../../src/models/register';
import { RegistrationProcessor } from '../../src/processors/registration-processor';
import { SendgridService } from '../../src/services/communication/email/sendgrid.service';

// Global mocks
const registrationDMMock = mock(RegisterDataMapperImpl);
const sendgridServiceMock = mock(SendgridService);
let registrationDataMapper: RegisterDataMapperImpl;
let emailService: SendgridService;
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

describe('TEST: Registration Processor', () => {
  beforeEach(() => {
    registrationDataMapper = instance(registrationDMMock);
    emailService = instance(sendgridServiceMock);
  });

  afterEach(() => {
    reset(registrationDMMock);
    reset(sendgridServiceMock);
  });
  describe('TEST: Process Registration', () => {
    it('it processes a valid registration', async () => {
      // GIVEN: A registration processor
      const registrationProcessor = new RegistrationProcessor(registrationDataMapper, emailService);
      // WHEN: Processing the registration
      await registrationProcessor.processRegistration(registration);
      // THEN: Registration was inserted
      verify(registrationDMMock.insert(registration)).once();
      // THEN: Registration was submitted
      verify(registrationDMMock.submit(registration)).once();
      // THEN: Confirmation email was sent
      verify(sendgridServiceMock.sendEmail(anything())).once();
    });
  });

  describe('TEST: Send email after registration', () => {
    it('it sends a confirmation email', async () => {
      // GIVEN: A registration processor
      const registrationProcessor = new RegistrationProcessor(registrationDataMapper, emailService);
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
});
