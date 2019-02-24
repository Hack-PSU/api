// INTEGRATION TESTS FOR /v1/live
/* eslint-disable no-undef,import/no-extraneous-dependencies */
process.env.APP_ENV = 'test';
const chai = require('chai');
const chaiHttp = require('chai-http');
const firebase = require('firebase');
const nock = require('nock');
const server = require('../../src/app');
require('../test_helper')();

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

describe('INTEGRATION TESTS: /v1/live', () => {
  afterEach((done) => {
    firebase.auth().signOut();
    if (listener) {
      listener();
    }
    done();
  });

  describe('GET: /updates', () => {
    it('it should get all current updates', (done) => {
      loginRegular()
        .then(user => user.getIdToken(true))
        .then((idToken) => {
          chai.request(server)
            .get('/v1/live/updates')
            .set('idtoken', idToken)
            .end((err, res) => {
              res.should.have.status(200);
              should.equal(err, null);
              res.body.should.be.a('array');
              done();
            });
        });
    });
  });

  describe('GET: /updates/reference', () => {
    it('it should get the update reference', (done) => {
      const updateReference = 'https://hackpsu18-staging.firebaseio.com/updates/5f77fb15127d473db7e3abdff74ab1dc';
      loginRegular()
        .then(user => user.getIdToken(true))
        .then((idToken) => {
          chai.request(server)
            .get('/v1/live/updates/reference')
            .set('idtoken', idToken)
            .end((err, res) => {
              res.should.have.status(200);
              should.equal(err, null);
              res.body.should.deep.equal({ reference: updateReference });
              done();
            });
        });
    });
  });

  describe('POST: /updates', () => {
    const generateGoodUpdate = (pushNotification = false) => ({
      updateTitle: 'Test Title',
      updateText: 'Test text',
      pushNotification,
    });

    const generateBadUpdate = () => {};

    it('should fail on malformed update', (done) => {
      loginAdmin()
        .then(user => user.getIdToken(true))
        .then((idToken) => {
          chai.request(server)
            .post('/v1/live/updates')
            .set('idtoken', idToken)
            .send(generateBadUpdate())
            .end((err, res) => {
              res.should.have.status(400);
              should.not.equal(err, null);
              should.equal(err.response.body.message, 'Update title must be provided');
              done();
            });
        });
    });

    it('should add a new update without push notification', (done) => {
      loginAdmin()
        .then(user => user.getIdToken(true))
        .then((idToken) => {
          chai.request(server)
            .post('/v1/live/updates')
            .set('idtoken', idToken)
            .send(generateGoodUpdate())
            .end((err, res) => {
              res.should.have.status(200);
              should.equal(err, null);
              done();
            });
        });
    });

    it('should add a new update with push notification', (done) => {
      const oneSignalScope = nock('https://onesignal.com')
        .post('/api/v1/notifications')
        .reply(200, {
          response: 'success',
        });
      loginAdmin()
        .then(user => user.getIdToken(true))
        .then((idToken) => {
          chai.request(server)
            .post('/v1/live/updates')
            .set('idtoken', idToken)
            .send(generateGoodUpdate(true))
            .end((err, res) => {
              res.should.have.status(200);
              should.equal(err, null);
              should.equal(oneSignalScope.isDone(), true);
              done();
            });
        });
    });
  });

  describe('GET: /events', () => {
    it('should get all current events', (done) => {
      loginRegular()
        .then(user => user.getIdToken(true))
        .then((idToken) => {
          chai.request(server)
            .get('/v1/live/events')
            .set('idtoken', idToken)
            .end((err, res) => {
              res.should.have.status(200);
              should.equal(err, null);
              res.body.should.be.a('array');
              done();
            });
        });
    });
  });

  describe('POST: /events', () => {
    const generateGoodEvent = () => ({
      eventLocation: '1',
      eventStartTime: new Date().getTime(),
      eventEndTime: new Date().getTime(),
      eventTitle: 'Test Event',
      eventDescription: 'Test description',
      eventType: 'workshop',
    });

    const generateBadEvent = () => {};

    it('should fail on malformed event', (done) => {
      loginAdmin()
        .then(user => user.getIdToken(true))
        .then((idToken) => {
          chai.request(server)
            .post('/v1/live/event')
            .set('idtoken', idToken)
            .send(generateBadEvent())
            .end((err, res) => {
              res.should.have.status(400);
              should.not.equal(err, null);
              should.equal(err.response.body.message, 'Event location must be provided');
              done();
            });
        });
    });

    it('should add a new event', (done) => {
      loginAdmin()
        .then(user => user.getIdToken(true))
        .then((idToken) => {
          chai.request(server)
            .post('/v1/live/event')
            .set('idtoken', idToken)
            .send(generateGoodEvent())
            .end((err, res) => {
              res.should.have.status(200);
              should.equal(err, null);
              done();
            });
        });
    });
  });
});
