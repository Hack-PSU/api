const firebase = require('firebase');
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../../app');
require('../test_helper')();

const should = chai.should();

chai.use(chaiHttp);

let listener;

/**
 *
 * @param email
 * @param password
 * @return {Promise<firebase.User>}
 */
function login(email, password) {
  return new Promise((resolve, reject) => {
    firebase.auth()
      .signInWithEmailAndPassword(email, password)
      .catch(err => reject(err));
    listener = firebase.auth()
      .onAuthStateChanged((user) => {
        if (user) {
          resolve(user);
        }
      });
  });
}

/**
 *
 * @return {Promise<firebase.User>}
 */
function loginRegular() {
  return login('reimbursement@email.com', 'password');
}

describe('INTEGRATION TESTS: /v1/users/reimbursement', () => {
  describe('POST: /', () => {
    const ENDPOINT = '/v1/users/reimbursement';
    it('it should fail due to malformed body', (done) => {
      // GIVEN: A regular user making a request
      loginRegular()
        .then(user => user.getIdToken(true))
        .then((idToken) => {
          // WHEN: The required body is not set
          chai.request(server)
            .post(ENDPOINT)
            .set('idtoken', idToken)
            .end((err, res) => {
              // THEN: The server responds with an error
              should.not.equal(err, null);
              res.status.should.equal(400);
              done();
            });
        });
    });

    it('it should respond with success on proper request', (done) => {
      // GIVEN: A regular user making a request
      loginRegular()
        .then(user => user.getIdToken(true))
        .then((idToken) => {
          // WHEN: The required body is properly set
          chai.request(server)
            .post(ENDPOINT)
            .set('idtoken', idToken)
            .attach('receipt', `${__dirname}/../testfile.jpg`)
            .field('fullName', 'Test name')
            .field('reimbursementAmount', 60)
            .field('mailingAddress', 'Test address')
            .field('groupMembers', '3')
            .end((err, res) => {
              // THEN: The server responds with success message
              should.equal(err, null);
              res.status.should.equal(200);
              res.body.should.deep.equal({ amount: 60 });
              done();
            });
        });
    });
  });
});
