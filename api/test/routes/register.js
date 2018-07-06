/* eslint-disable no-undef */
process.env.APP_ENV = 'test';
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../../app');
const sql = require('mysql');
const squel = require('squel');
const Chance = require('chance');
const firebase = require('firebase');
const util = require('util');
require('../test_helper')();

const chance = new Chance(123);

const sqlOptions = require('../../assets/constants/constants').sqlConnection;

const connection = sql.createConnection(sqlOptions);
util.promisify(connection.connect);

async function connect() {
  await connection.connect((err) => {
    if (err) {
      console.error(err);
    }
  });
}

// // Initialize Firebase
// const config = {
//   apiKey: 'AIzaSyCpvAPdiIcqKV_NTyt6DZgDUNyjmA6kwzU',
//   authDomain: 'hackpsu18.firebaseapp.com',
//   databaseURL: 'https://hackpsu18-test.firebaseio.com',
//   projectId: 'hackpsu18',
//   storageBucket: 'hackpsu18.appspot.com',
//   messagingSenderId: '1002677206617',
// };
// firebase.initializeApp(config);

connect();

const should = chai.should();

chai.use(chaiHttp);


let listener = null;

/**
 *
 * @param email
 * @param password
 * @return {Promise<firebase.User>}
 */
function login(email, password) {
  return new Promise((resolve, reject) => {
    firebase.auth().signInWithEmailAndPassword(email, password).catch(err => reject(err));
    listener = firebase.auth().onAuthStateChanged((user) => {
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
  return login('test@email.com', 'password');
}

/**
 *
 * @return {{firstName: null, lastName: null, email: null, gender: any, shirtSize: *, dietaryRestriction: *, university: *}}
 */
function generateBadRegistration() {
  return {
    firstName: chance.bool() ? chance.first() : null,
    lastName: chance.bool() ? chance.last() : null,
    email: chance.bool() ? chance.email() : null,
    gender: chance.bool() ? chance.gender().toLowerCase() : null,
    shirtSize: chance.bool() ? 'M' : null,
    dietaryRestriction: chance.bool() ? 'vegetarian' : null,
    university: chance.bool() ? 'Georgetown university' : null,
  };
}

/**
 *
 * @return {{firstName: *, lastName: *, email: *, gender: string, shirtSize: string, dietaryRestriction: string, university: string, travelReimbursement: boolean, firstHackathon: boolean, academicYear: string, major: string, phone, ethnicity: string, codingExperience: string, eighteenBeforeEvent: boolean, mlhcoc: boolean, mlhdcp: boolean, uid: string, referral: string, project, expectations, veteran: boolean}}
 */
function generateGoodRegistration() {
  return {
    firstName: chance.first(),
    lastName: chance.last(),
    email: chance.email(),
    gender: chance.gender().toLowerCase(),
    shirtSize: 'M',
    dietaryRestriction: 'vegetarian',
    university: 'Georgetown University',
    travelReimbursement: false,
    firstHackathon: true,
    academicYear: 'freshman',
    major: 'Visual aesthetics',
    phone: chance.phone(),
    ethnicity: 'caucasian',
    codingExperience: 'beginner',
    eighteenBeforeEvent: true,
    mlhcoc: true,
    mlhdcp: true,
    uid: 'CgnrzbSsqDZru1KbhTLI5AUdhZB2',
    referral: 'Facebook',
    project: chance.sentence(),
    expectations: chance.sentence(),
    veteran: true,
  };
}

describe('pre-registration tests', () => {
  const succMatrix = ['abc@xyz.com', 'myname@email.com', 'a@b.com'];
  before((done) => {
    // Remove existing pre-registrations
    const promises = succMatrix.map(email => new Promise((resolve, reject) => {
      const query = squel.delete({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
        .from('PRE_REGISTRATION')
        .where('email = ?', email)
        .toParam();
      query.text = query.text.concat(';');
      connection.query(query.text, query.values, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    }));
    Promise.all(promises)
      .then(() => done())
      .catch(err => done(err));
  });
  it('it should respond with success', (done) => {
    const promises = [];
    succMatrix.forEach((email) => {
      promises.push(new Promise((resolve) => {
        chai.request(server)
          .post('/v1/register/pre')
          .type('form')
          .send({
            email,
          })
          .end((err, res) => {
            should.equal(err, null);
            res.should.have.status(200);
            resolve();
          });
      }));
    });
    Promise.all(promises).then(() => {
      done();
    }).catch((err) => {
      done(err);
    });
  });


  it('should error out each time', (done) => {
    const failMatrix = ['', 'jadlksfjalskdjf', 'j'];
    const promises = [];
    failMatrix.forEach((email) => {
      promises.push(new Promise((resolve) => {
        chai.request(server)
          .post('/v1/register/pre')
          .type('form')
          .send({
            email,
          })
          .end((err, res) => {
            res.should.have.status(400);
            resolve();
          });
      }));
    });
    Promise.all(promises).then(() => {
      done();
    }).catch((err) => {
      console.error(err);
    });
  });
  after((done) => {
    done();
  });
});


describe('registration tests', () => {
  let idToken = null;

  // Scrub DB
  before((done) => {
    const query0 = squel.delete({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from('RSVP')
      .where('user_id = ?', 'CgnrzbSsqDZru1KbhTLI5AUdhZB2')
      .toParam();
    query0.text = query0.text.concat(';');
    const query = squel.delete({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from('REGISTRATION')
      .where('uid = ?', 'CgnrzbSsqDZru1KbhTLI5AUdhZB2')
      .toParam();
    query.text = ''.concat(query0.text).concat(query.text.concat(';'));
    query.values.push(query0.values[0]);
    connection.query(query.text, query.values, (err) => {
      if (err) {
        done(err);
      } else {
        done();
      }
    });
  });

  beforeEach((done) => {
    loginRegular()
      .then((user) => {
        user.getIdToken(true)
          .then((decodedIdToken) => {
            idToken = decodedIdToken;
            done();
          }).catch(err => done(err));
      }).catch(err => done(err));
  });

  afterEach((done) => {
    if (listener) {
      listener();
    }
    firebase.auth().signOut();
    done();
  });

  describe('failures', () => {
    it('it should fail due to invalid data options', (done) => {
      chai.request(server)
        .post('/v1/register')
        .set('idtoken', idToken)
        .type('form')
        .send(generateBadRegistration())
        .end((err, res) => {
          res.should.have.status(400);
          done();
        });
    });
  });
  describe('successes', () => {
    it('it should succeed and respond with success', (done) => {
      chai.request(server)
        .post('/v1/register')
        .set('idtoken', idToken)
        .type('form')
        .send(generateGoodRegistration())
        .end((err, res) => {
          res.should.have.status(200);
          should.equal(res.body.response, 'Success');
          should.equal(err, null);
          done();
        });
    });
  });
});

