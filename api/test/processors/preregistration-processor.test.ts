import { expect } from 'chai';
import 'mocha';
import { instance, mock, reset, verify } from 'ts-mockito';
import { PreRegisterDataMapperImpl } from '../../lib/models/register';
import { PreRegistration } from '../../lib/models/register/pre-registration';
import { PreRegistrationProcessor } from '../../lib/processors/pre-registration-processor';

// Global mocks
const preregistrationDMMock = mock(PreRegisterDataMapperImpl);
let preregistrationDataMapper: PreRegisterDataMapperImpl;
const registration = new PreRegistration('test@email.com');

describe('TEST: Pre Registration Processor', () => {
  beforeEach(() => {
    preregistrationDataMapper = instance(preregistrationDMMock);
  });

  afterEach(() => {
    reset(preregistrationDMMock);
  });
  describe('TEST: Process Registration', () => {
    it('it processes a valid registration', async () => {
      // GIVEN: A registration processor
      const registrationProcessor = new PreRegistrationProcessor(preregistrationDataMapper);
      // WHEN: Processing the registration
      await registrationProcessor.processPreregistration(registration);
      // THEN: Registration was inserted
      verify(preregistrationDMMock.insert(registration)).once();
    });
  });
});
