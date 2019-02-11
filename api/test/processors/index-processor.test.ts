import { expect } from 'chai';
import 'mocha';
import { IndexProcessor } from '../../lib/processors/index-processor';

let indexProcessor: IndexProcessor;

describe('TEST: Index Controller', () => {
  it('responds with \'Welcome to HackPSU response body\'', async () => {
    // GIVEN: Index Processor instance
    indexProcessor = new IndexProcessor();
    // WHEN: Index response is generated
    const response = await indexProcessor.processIndex();
    // THEN: response fields are correctly set
    const expectedBody = {
      api_response: 'Welcome to the HackPSU API!',
      body: { result: 'Success', data: {} },
      status: 200,
    };
    expect(response).to.deep.equal(expectedBody);
  });
});
