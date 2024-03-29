/* eslint-disable no-undef,import/no-extraneous-dependencies */
process.env.APP_ENV = 'test';
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../../../src/app');
const firebase = require('firebase');
const admin = require('firebase-admin');
const Chance = require('chance');
require('../../test_helper')();

const chance = new Chance();

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


describe('test get registered hackers', () => {
  afterEach((done) => {
    firebase.auth().signOut();
    if (listener) {
      listener();
    }
    done();
  });
  // Failure test 1
  describe('No auth failure', () => {
    it('it should reject with an unauthorized message', (done) => {
      chai.request(server)
        .get('/v1/firebase/registered')
        .end((err, res) => {
          res.should.have.status(401);
          err.response.body.should.be.a('object');
          should.equal(err.response.body.error, 'ID Token must be provided');
          done();
        });
    });
  });
  describe('regular user auth failure', () => {
    it('it should reject with an lack of privileges message', (done) => {
      loginRegular().then((user) => {
        user.getIdToken(true)
          .then((idToken) => {
            chai.request(server)
              .get('/v1/firebase/registered')
              .set('content-type', 'application/json')
              .set('idtoken', idToken)
              .end((err, res) => {
                res.should.have.status(401);
                err.response.body.should.be.a('object');
                should.equal(err.response.body.error, 'You do not have sufficient permissions for this operation');
                done();
              });
          }).catch(error => done(error));
      }).catch(err => done(err));
    });
  });
  describe('firebase auth success', () => {
    it('it should accept and return an array of registered hackers', (done) => {
      loginAdmin().then((user) => {
        user.getIdToken(true)
          .then((idToken) => {
            chai.request(server)
              .get('/v1/firebase/registered')
              .set('content-type', 'application/json')
              .set('idtoken', idToken)
              .end((err, res) => {
                res.status.should.satisfy(num => num === 200 || num === 207);
                res.body.should.be.a('array');
                done();
              });
          }).catch(error => done(error));
      }).catch(err => done(err));
    });
  });
});

describe('test user id', () => {
  afterEach(() => {
    firebase.auth().signOut();
    if (listener) {
      listener();
    }
  });
  describe('un-authenticated user tries to get user id', () => {
    it('it should reject un-authenticated user with and unauthenticated message', (done) => {
      chai.request(server)
        .get('/v1/firebase/userid')
        .query({ email: 'test@email.com' })
        .end((err, res) => {
          res.should.have.status(401);
          err.response.body.should.be.a('object');
          should.equal(err.response.body.error, 'ID Token must be provided');
          done();
        });
    });
  });
  describe('user with insufficient permission tries to get user id', () => {
    it('it should reject with an lack of privileges message', (done) => {
      loginRegular().then((user) => {
        user.getIdToken(true)
          .then((idToken) => {
            chai.request(server)
              .get('/v1/firebase/userid')
              .set('content-type', 'application/json')
              .set('idtoken', idToken)
              .query({ email: 'test@email.com' })
              .end((err, res) => {
                res.should.have.status(401);
                err.response.body.should.be.a('object');
                should.equal(err.response.body.error, 'You do not have sufficient permissions for this operation');
                done();
              });
          }).catch(error => done(error));
      }).catch(err => done(err));
    });
  });
  describe('firebase auth success', () => {
    it('it should accept and return an userid associated with the email', (done) => {
      loginAdmin().then((user) => {
        user.getIdToken(true)
          .then((idToken) => {
            chai.request(server)
              .get('/v1/firebase/userid')
              .set('content-type', 'application/json')
              .set('idtoken', idToken)
              .query({ email: 'test@email.com' })
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                done();
              });
          }).catch(error => done(error));
      }).catch(err => done(err));
    });
  });
});

describe('test make firebase', () => {
  afterEach(() => {
    firebase.auth().signOut();
    if (listener) {
      listener();
    }
  });
  describe('un-authenticated tries to make firebase', () => {
    it('it should error out with not authenticated error', (done) => {
      chai.request(server)
        .post('/v1/firebase/makeadmin')
        .set('content-type', 'application/json')
        .send({ uid: 'ykdPNZkuXXYLkmv4MmLeGnoSF8g2' })
        .end((err, res) => {
          res.should.have.status(401);
          err.response.body.should.be.a('object');
          err.response.body.error.should.be.equal('ID Token must be provided');
          done();
        });
    });
  });
  describe('user tries to make firebase', () => {
    describe('user does not provide uid', () => {
      it('it should reject with lack of permissions', (done) => {
        loginRegular().then((user) => {
          user.getIdToken(true)
            .then((idToken) => {
              chai.request(server)
                .post('/v1/firebase/makeadmin')
                .set('content-type', 'application/json')
                .set('idtoken', idToken)
                .end((err, res) => {
                  res.should.have.status(401);
                  err.response.body.should.be.a('object');
                  err.response.body.error.should.be.equal('You do not have sufficient permissions for this operation');
                  done();
                });
            }).catch(err => done(err));
        }).catch(err => done(err));
      });
    });
    describe('user provides firebase uid', () => {
      it('it should reject with lack of permissions', (done) => {
        loginRegular().then((user) => {
          user.getIdToken(true)
            .then((idToken) => {
              chai.request(server)
                .post('/v1/firebase/makeadmin')
                .set('content-type', 'application/json')
                .set('idtoken', idToken)
                .send({ uid: 'gsOwfFcUHKfmRHTsmI7N1k7Ocie2' })
                .end((err, res) => {
                  res.should.have.status(401);
                  err.response.body.should.be.a('object');
                  err.response.body.error.should.be.equal('You do not have sufficient permissions for this operation');
                  done();
                });
            }).catch(err => done(err));
        }).catch(err => done(err));
      });
    });
    describe('user provides valid uid', () => {
      it('it should reject with lack of permissions', (done) => {
        loginRegular().then((user) => {
          user.getIdToken(true)
            .then((idToken) => {
              chai.request(server)
                .post('/v1/firebase/makeadmin')
                .set('content-type', 'application/json')
                .set('idtoken', idToken)
                .send({ uid: 'ykdPNZkuXXYLkmv4MmLeGnoSF8g2' })
                .end((err, res) => {
                  res.should.have.status(401);
                  err.response.body.should.be.a('object');
                  err.response.body.error.should.be.equal('You do not have sufficient permissions for this operation');
                  done();
                });
            }).catch(err => done(err));
        }).catch(err => done(err));
      });
    });
  });
  describe.skip('firebase tries to make firebase', () => {
    let genUid = null;
    after((done) => {
      if (genUid) {
        admin.auth().deleteUser(genUid).catch(error => console.log(error));
      }
      if (listener) {
        listener();
      }
      firebase.auth().signOut();
      done();
    });
    before((done) => {
      admin.auth().createUser({
        email: 'temp@email.com',
        emailVerified: false,
        password: 'password',
      }).then((userRecord) => {
        genUid = userRecord.uid;
        done();
      }).catch(error => done(error));
    });
    describe('firebase success', () => {
      it('it should succeed', (done) => {
        loginAdmin().then((user) => {
          user.getIdToken(true)
            .then((idToken) => {
              chai.request(server)
                .post('/v1/firebase/makeadmin')
                .set('content-type', 'application/json')
                .set('idtoken', idToken)
                .send({ uid: genUid, privilege: 4 })
                .end((err, res) => {
                  res.should.have.status(200);
                  should.equal('Success', res.text);
                  should.equal(err, null);
                  done();
                });
            });
        }).catch(err => done(err));
      });
    });
    describe('firebase failures', () => {
      it('it should fail due to improper inputs', (done) => {
        loginAdmin().then((user) => {
          user.getIdToken(true)
            .then((idToken) => {
              chai.request(server)
                .post('/v1/firebase/makeadmin')
                .set('content-type', 'application/json')
                .set('idtoken', idToken)
                .send({ privilege: 4 })
                .end((err, res) => {
                  res.should.have.status(400);
                  err.response.body.should.be.a('object');
                  done();
                });
            }).catch(err => done(err));
        }).catch(err => done(err));
      });
    });
  });
});

describe.skip('test send emails', () => {
  /**
   *
   * @return {Object} JSON Parameter that has no errors
   */
  const buildGoodInput = () => {
    const result = {};
    result.emails = [];
    const numEmails = (Math.random() * 5) + 1;
    for (let i = 0; i < numEmails; i += 1) {
      result.emails.push({
        email: chance.email(),
        name: chance.name(),
        substitutions: {
          date: new Date().toDateString(),
          key: chance.md5(new Date().getTime().toString()),
        },
      });
    }
    result.subject = chance.sentence();
    result.html = 'Hello $name$, This is a test email, sent on date: $date$. Your unique key is $key$. Thanks! HackPSU test';
    return result;
  };
  /**
   *
   * @param {String[]} params
   */
  const buildBadInput = (params) => {
    const result = {};
    result.emails = [];
    const numEmails = (Math.random() * 5) + 1;
    for (let i = 0; i < numEmails; i += 1) {
      result.emails.push({
        email: chance.email(),
        name: chance.name(),
        substitutions: {
          date: new Date().toDateString(),
          key: chance.md5(new Date().getTime().toString()),
        },
      });
    }
    result.subject = chance.md5(new Date().getTime().toString());
    result.html = 'Hello $name$, This is a test email, sent on date: $date$. Your unique key is $key$. Thanks! HackPSU test';
    while (params.length > 0) {
      const nextBad = params.pop();
      switch (nextBad) {
        case 'email':
          result.emails = [];
          for (let i = 0; i < numEmails; i += 1) {
            if (chance.bool({ likelihood: 25 })) {
              result.emails.push({
                email: chance.email(),
                name: chance.name(),
                substitutions: {
                  date: new Date().toDateString(),
                  key: chance.md5(new Date().getTime().toString()),
                },
              });
            } else {
              result.emails.push({
                email: chance.md5(new Date().getTime().toString()),
                substitutions: {
                  date: chance.bool() ? new Date().toDateString() : null,
                  key: chance.bool() ? chance.md5(new Date().getTime().toString()) : null,
                },
              });
            }
          }
          break;
        case 'subject':
          result.subject = null;
          break;
        case 'html':
          result.html = chance.bool() ? 'Hello, This is a test with no substitutables' : 'Hello $name$, This is an $email$ with illegal substitutables';
          break;
        default:
          break;
      }
    }
    return result;
  };
  afterEach(() => {
    firebase.auth().signOut();
    if (listener) {
      listener();
    }
  });
  describe('unauthenticated tries to send emails', () => {
    it('it should error out with not authenticated error', (done) => {
      chai.request(server)
        .post('/v1/firebase/email')
        .send(buildGoodInput())
        .end((err, res) => {
          res.should.have.status(401);
          err.response.body.should.be.a('object');
          err.response.body.error.should.be.equal('ID Token must be provided');
          done();
        });
    });
  });
  describe('regular user tries to send emails', () => {
    it('it should error out with lack of permissions', (done) => {
      loginRegular()
        .then((user) => {
          user.getIdToken(true)
            .then((idToken) => {
              chai.request(server)
                .post('/v1/firebase/email')
                .send(buildGoodInput())
                .set('idtoken', idToken)
                .end((err, res) => {
                  res.should.have.status(401);
                  err.response.body.should.be.a('object');
                  err.response.body.error.should.be.equal('You do not have sufficient permissions for this operation');
                  done();
                });
            }).catch(err => done(err));
        }).catch(err => done(err));
    });
  });
  describe('firebase tries to send bad email', () => {
    describe('firebase uses bad email ids', () => {
      it('it should error the bad emails', (done) => {
        loginAdmin()
          .then((user) => {
            user.getIdToken(true)
              .then((idToken) => {
                chai.request(server)
                  .post('/v1/firebase/email')
                  .send(buildBadInput(['email']))
                  .set('idtoken', idToken)
                  .end((err, res) => {
                    res.should.have.status(207);
                    res.body.should.be.an('array');
                    res.body.forEach((response) => {
                      if (response.error) {
                        response.error.should.match(/data.email should match format "email"/);
                      }
                    });
                    done();
                  });
              }).catch(err => done(err));
          }).catch(err => done(err));
      });
    });
    describe('firebase uses bad subject', () => {
      it('it should error all emails', (done) => {
        loginAdmin()
          .then((user) => {
            user.getIdToken(true)
              .then((idToken) => {
                chai.request(server)
                  .post('/v1/firebase/email')
                  .send(buildBadInput(['subject']))
                  .set('idtoken', idToken)
                  .end((err, res) => {
                    res.should.have.status(400);
                    err.response.body.should.be.an('object');
                    err.response.body.error.should.match(/Email subject must be provided/);
                    done();
                  });
              }).catch(err => done(err));
          }).catch(err => done(err));
      });
    });
    describe('firebase sends good email', () => {
      it('it should succeed', (done) => {
        loginAdmin()
          .then((user) => {
            user.getIdToken(true)
              .then((idToken) => {
                chai.request(server)
                  .post('/v1/firebase/email')
                  .set('idtoken', idToken)
                  .send(buildGoodInput())
                  .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.an('array');
                    done();
                  });
              }).catch(err => done(err));
          }).catch(err => done(err));
      });
    });
  });
});
