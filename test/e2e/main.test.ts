process.env.APP_ENV = 'test';
import * as chai from 'chai';
import chaiHttp from 'chai-http';
import 'mocha';
import app from '../../src/app';

import test_helper from '../test_helper';

chai.use(chaiHttp);

test_helper();

const { expect } = chai;

// First index test
describe('INTEGRATION TEST: /', () => {
  it('it should respond with a simple success message', async () => {
    // GIVEN: API
    // WHEN: GET: /
    const res = await chai.request(app).get('/');
    // THEN: Responds with success message
    expect(res).status(200);
    expect(res).header('\'content-type\', /^application\\/json.*/');
    expect(res.body).to.deep.equal({});
    res.should.have.status(200);
  });
});
