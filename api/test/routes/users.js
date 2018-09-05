const chai = require('chai');
const chaiHttp = require('chai-http');
const sql = require('mysql');
const firebase = require('firebase');
const Chance = require('chance');
require('../test_helper')();
const server = require('../../app');
const { RSVP } = require('../../models/RSVP');
const { UowFactory } = require('../../services/factories/uow_factory');
const { Registration } = require('../../models/Registration');

const chance = new Chance();

const sqlOptions = require('../../assets/constants/constants').sqlConnection;

const connection = sql.createConnection(sqlOptions);
const standardAccessUid = 'CgnrzbSsqDZru1KbhTLI5AUdhZB2';

connection.connect((err) => {
  if (err) {
    console.error(err);
  }
});

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
  return login('test@email.com', 'password');
}

/**
 *
 * @return {{firstName, lastName: *, email, gender: string, shirtSize: string,
 * dietaryRestriction: string, university: string, travelReimbursement: boolean,
 * firstHackathon: boolean, academicYear: string, major: string,
 * phone: number, ethnicity: string, codingExperience: string,
 * eighteenBeforeEvent: boolean, mlhcoc: boolean, mlhdcp: boolean, uid: string,
 * referral: string, project: *, expectations: *, veteran: boolean}}
 */
function generateGoodRegistration() {
  return {
    firstName: chance.first(),
    lastName: chance.last(),
    email: chance.email(),
    gender: chance.gender()
      .toLowerCase(),
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
    uid: standardAccessUid,
    referral: 'Facebook',
    project: chance.sentence(),
    expectations: chance.sentence(),
    veteran: true,
    hackathon: '84ed52ff52f84591aabe151666fae240',
  };
}

describe('get registration', () => {
  let idToken = null;
  let generatedRegistration = null;
  // Create the registration if it does not exist
  before((done) => {
    generatedRegistration = generateGoodRegistration();
    loginRegular()
      .then(user => user.getIdToken(true))
      .then((decodedIdToken) => {
        idToken = decodedIdToken;
        chai.request(server)
          .post('/v1/register')
          .set('idtoken', idToken)
          .type('form')
          .send(generatedRegistration)
          .end((err, res) => {
            done();
          });
      })
      .catch(err => done(err));
  });

  describe('failure', () => {
    it('it should respond with an unauthorized message', (done) => {
      chai.request(server)
        .get('/v1/users/registration')
        .end((err, res) => {
          res.should.have.status(401);
          should.equal(err.response.body.error, 'ID Token must be provided');
          done();
        });
    });
  });

  describe('success', () => {
    it('it should return the user information', (done) => {
      chai.request(server)
        .get('/v1/users/registration')
        .set('idtoken', idToken)
        .end((err, res) => {
          should.equal(err, null);
          res.body.should.be.a('object');
          done();
        });
    });
  });

  after((done) => {
    firebase.auth()
      .signOut();
    done();
  });
});


// no idtoken
// non existant user
// rsvp success
describe('TEST: /v1/rsvp: rsvp user', () => {
  const checkin = true;
  let idToken = null;
  let loggedInUser = null;
  before((done) => {
    loginRegular()
      .then((user) => {
        loggedInUser = user;
        return user.getIdToken(true);
      })
      .then((decodedIdToken) => {
        idToken = decodedIdToken;
        const generatedRegistration = generateGoodRegistration();
        generatedRegistration.email = 'test@email.com';
        generatedRegistration.uid = loggedInUser.uid;
        generatedRegistration.pin = 78;
        chai.request(server)
          .post('/v1/register')
          .set('idtoken', idToken)
          .type('form')
          .send(generatedRegistration)
          .end(() => {
            done();
          });
      })
      .catch(done);
  });

  describe('unauthorized failure', () => {
    it('it should respond with an unauthorized message', (done) => {
      chai.request(server)
        .post('/v1/users/rsvp')
        .end((err, res) => {
          res.should.have.status(401);
          should.equal(err.response.body.error, 'ID Token must be provided');
          done();
        });
    });
  });

  describe('illegal value failure', () => {
    it('it should respond with a missing value message', (done) => {
      chai.request(server)
        .post('/v1/users/rsvp')
        .set('idtoken', idToken)
        .end((err, res) => {
          res.should.have.status(400);
          should.equal(err.response.body.error, 'RSVP value must be included');
          done();
        });
    });
  });

  describe('success', () => {
    let uow;
    beforeEach((done) => {
      // Remove RSVP from db if exists
      UowFactory.create()
        .then((UOW) => {
          uow = UOW;
          return new RSVP({ userUID: loggedInUser.uid }, uow)
            .delete();
        })
        .then(() => {
          uow.complete();
          done();
        })
        .catch(done);
    });
    it('it should accept an RSVP value of false', (done) => {
      chai.request(server)
        .post('/v1/users/rsvp')
        .set('idtoken', idToken)
        .send({ rsvp: false.toString() })
        .end((err, res) => {
          should.equal(err, null);
          res.should.have.status(200);
          done();
        });
    });

    it('it should send send an email containing their pin', (done) => {
      chai.request(server)
        .post('/v1/users/rsvp')
        .set('idtoken', idToken)
        .send({ rsvp: checkin.toString() })
        .end((err, res) => {
          should.equal(err, null);
          res.should.have.status(200);
          done();
        });
    });
  });

  after((done) => {
    firebase.auth()
      .signOut();
    done();
  });
});
