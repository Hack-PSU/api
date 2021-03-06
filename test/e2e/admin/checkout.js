/* eslint-disable no-undef,import/no-extraneous-dependencies */
process.env.APP_ENV = 'test';
const chai = require('chai');
const util = require('util');
const chaiHttp = require('chai-http');
const server = require('../../../src/app');
const squel = require('squel');
const firebase = require('firebase');
const { CheckoutObject, TABLE_NAME: CheckoutTableName } = require('../../../src/models/CheckoutObject');
const { Hackathon } = require('../../../src/models/Hackathon');
const sql = require('mysql');
require('../../test_helper')();
const { sqlConnection } = require('../../../src/assets/constants/constants');

const connection = sql.createConnection(sqlConnection);
util.promisify(connection.connect);

async function connect() {
  await connection.connect((err) => {
    if (err) {
      console.error(err);
    }
  });
}

connect();
const should = chai.should();

chai.use(chaiHttp);

let listener = null;

function login(email, password) {
  return new Promise((resolve, reject) => {
    firebase.auth().signInWithEmailAndPassword(email, password)
      .catch(err => reject(err));
    listener = firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        resolve(user);
      }
    });
  });
}

function loginRegular() {
  return login('test@email.com', 'password');
}

function loginAdmin() {
  return login('firebase@email.com', 'password');
}

describe('INTEGRATION TESTS: /v1/firebase/checkout', () => {
  afterEach((done) => {
    firebase.auth().signOut();
    if (listener) {
      listener();
    }
    done();
  });

  describe('POST: /', () => {
    const ENDPOINT = '/v1/firebase/checkout';
    let loggedInUser;

    it('it should fail on malformed body', (done) => {
      // GIVEN: Administrator making a request
      loginAdmin()
        .then(user => user.getIdToken(true))
        .then((idToken) => {
          // WHEN: Making a request with bad data
          chai.request(server)
            .post(ENDPOINT)
            .set('idtoken', idToken)
            .end((err, res) => {
              // THEN: Should fail with 400 error response
              res.should.have.status(400);
              should.not.equal(err, null);
              done();
            });
        });
    });

    it('it should succeed on good response', (done) => {
      // GIVEN: Administrator making a request
      loginAdmin()
        .then((user) => {
          loggedInUser = user;
          return user.getIdToken(true);
        })
        .then((idToken) => {
          // WHEN: Making a legal request
          chai.request(server)
            .post(ENDPOINT)
            .set('idtoken', idToken)
            .send({
              itemId: '1',
              userId: loggedInUser.uid,
            })
            .end((err, res) => {
              // THEN: Should succeed with success message
              res.should.have.status(200);
              should.equal(err, null);
              res.body.should.deep.equal({ message: 'Success' });
              done();
            });
        });
    });

    after((done) => {
      const query = squel.delete({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
        .from(CheckoutTableName)
        .where('item_id = 1')
        .where('user_id = ?', loggedInUser.uid)
        .toParam();
      connection.query(query.text, query.values, (err) => {
        if (err) {
          done(err);
        } else {
          done();
        }
      });
    });
  });

  describe('POST: /return', () => {
    const ENDPOINT = '/v1/firebase/checkout/return';
    let addedCheckoutObject = null;
    before((done) => {
      // Add new checkout instance.
      loginAdmin()
        .then((user) => {
          addedCheckoutObject = new CheckoutObject({
            itemId: '1',
            userId: user.uid,
            checkoutTime: new Date().getTime(),
          }, null);
          const query = squel.insert({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
            .into(CheckoutTableName)
            .setFieldsRows([addedCheckoutObject.dbRepresentation])
            .set('hackathon', Hackathon.getActiveHackathonQuery())
            .toString();
          connection.query(query, [], (err, results) => {
            if (err) {
              done(err);
            }
            addedCheckoutObject.uid = results.insertId;
            addedCheckoutObject.hackathon = null;
            done();
          });
        });
    });

    it('it should fail due to malformed body', (done) => {
      // GIVEN: Administrator making a request
      loginAdmin()
        .then(user => user.getIdToken(true))
        .then((idToken) => {
          // WHEN: Making a request with bad data
          chai.request(server)
            .post(ENDPOINT)
            .set('idtoken', idToken)
            .end((err, res) => {
              // THEN: Should fail with 400 error response
              res.should.have.status(400);
              should.not.equal(err, null);
              done();
            });
        });
    });

    it('it should succeed in setting an item returned', (done) => {
      // GIVEN: Administrator making a request
      loginAdmin()
        .then(user => user.getIdToken(true))
        .then((idToken) => {
          // WHEN: Making a legal request
          chai.request(server)
            .post(ENDPOINT)
            .set('idtoken', idToken)
            .send({ checkoutId: addedCheckoutObject.uid })
            .end((err, res) => {
              // THEN: Should succeed with success message
              res.should.have.status(200);
              should.equal(err, null);
              res.body.should.deep.equal({ message: 'Success' });
              done();
            });
        });
    });

    after((done) => {
      const query = squel.delete({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
        .from(CheckoutTableName)
        .where('uid = ?', addedCheckoutObject.uid)
        .toParam();
      connection.query(query.text, query.values, (err) => {
        if (err) {
          done(err);
        } else {
          done();
        }
      });
    });
  });

  describe('GET: /', () => {
    const ENDPOINT = '/v1/firebase/checkout';
    it('it should return a list of checked out items', (done) => {
      // GIVEN: Administrator makes a request
      loginAdmin()
        .then(user => user.getIdToken(true))
        .then((idToken) => {
          // WHEN: A legal request is made
          chai.request(server)
            .get(ENDPOINT)
            .set('idtoken', idToken)
            .end((err, res) => {
              // THEN: An array of responses is received
              should.equal(err, null);
              res.body.should.be.an('array');
              done();
            });
        });
    });
  });
});
