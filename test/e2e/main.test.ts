import { app, chai, testHelper } from '../test_helper';
testHelper();

const { expect } = chai;

// First index test
describe('INTEGRATION TEST: /', () => {
  it('it should respond with a simple success message', async () => {
    // GIVEN: API
    // WHEN: GET: /
    const res = await chai.request(app).get('/');
    // THEN: Responds with success message
    expect(res).status(200);
    expect(res).header('content-type', 'application/json; charset=utf-8');
    expect(res.body).to.deep.equal({
      api_response: 'Welcome to the HackPSU API!',
      body: {
        data: {},
        result: 'Success',
      },
      status: 200,
    });
  });
});
