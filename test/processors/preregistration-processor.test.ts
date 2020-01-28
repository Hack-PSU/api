import { expect } from 'chai';
import 'mocha';
import { instance, mock, reset, verify } from 'ts-mockito';
import { PreRegisterDataMapperImpl } from '../../src/models/register/pre-register-data-mapper-impl';
import { PreRegistration } from '../../src/models/register/pre-registration';
import { PreRegistrationProcessor } from '../../src/processors/pre-registration-processor';

// Global mocks
const preregistrationDMMock = mock(PreRegisterDataMapperImpl);
let preregistrationDataMapper: PreRegisterDataMapperImpl;
const preregistration = new PreRegistration({ email: 'test@email.com' });

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
      await registrationProcessor.processPreregistration(preregistration);
      // THEN: Registration was inserted
      verify(preregistrationDMMock.insert(preregistration)).once();
    });
  });
});
