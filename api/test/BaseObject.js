/* eslint-disable import/no-dynamic-require,global-require,no-undef,array-callback-return,new-cap,no-unused-expressions */
const sinon = require('sinon');
const chai = require('chai');
const fs = require('fs');
const { Readable } = require('stream');
const chaiStream = require('chai-stream');

require('dotenv').config();

process.env.SQL_DATABASE = 'test';

const MysqlUow = require('../services/mysql_uow');
const RtdbUow = require('../services/rtdb_uow');

const modelFiles = fs.readdirSync('./models')
  .map(a => a.replace(/\.js/g, ''))
  .filter(a => a !== 'BaseObject');
const models = modelFiles.map(model => require(`../models/${model}`)[model]);

chai.use(chaiStream);
const should = chai.should();
const { expect } = chai;


describe('Object CRUD tests', () => {
  // Given: Uow objects.
  const uow = {};
  const uowrtdb = {};

  before('Setup mock DB', (done) => {
    // Configure mock DB.
    // Given: Mysql-cache driver and firebase driver.
    uow.query = sinon.stub(MysqlUow.prototype, 'query');
    uowrtdb.query = sinon.stub(RtdbUow.prototype, 'query');
    done();
  });

  beforeEach('Push data into the stream', (done) => {
    // Given: resolutionPromise
    const mysqlPromise = Promise.resolve([{}, {}]);
    const firebasePromise = Promise.resolve({});

    // Given: Stream of data
    const readableStream = new Readable();
    readableStream.push(null);

    // When: Call a query.
    const mysqlExpectation = uow.query.withArgs(sinon.match.any, sinon.match.any);
    const mysqlExpectationStream = uow.query
      .withArgs(sinon.match.any, sinon.match.any, { stream: true });
    const firebaseExpectation = uowrtdb.query
      .withArgs(sinon.match.any, sinon.match.any, sinon.match.any);
    const firebaseExpectation2 = uowrtdb.query
      .withArgs(sinon.match.any, sinon.match.any);
    // Then: yield empty result with no error.
    mysqlExpectation.returns(mysqlPromise);
    mysqlExpectationStream.returns(Promise.resolve(readableStream));
    firebaseExpectation.returns(firebasePromise);
    firebaseExpectation2.returns(Promise.resolve(readableStream));
    done();
  });

  afterEach('Tear down mocked DB', () => {
    uow.query.restore();
    uowrtdb.query.restore();
  });

  models.forEach((model) => {
    describe(`Testing ${model.name}`, () => {
      describe(`Get all ${model.name}`, () => {
        it(`it should get all objects of type ${model.name}`, (done) => {
          try {
            model.getAll(model.useRTDB ? uowrtdb : uow)
              .then((result) => {
                expect(result).to.be.a.ReadableStream;
                done();
              }).catch(done);
          } catch (e) {
            if (e.message !== 'This method is not supported by this class' && e.message !== 'Not implemented') {
              done(e);
            } else {
              done();
            }
          }
        });
      });

      describe(`Add new ${model.name}`, () => {
        let obj;
        it('should fail validation', (done) => {
          obj = new model({ }, uow);
          try {
            obj.add()
              .then(() => {
                done(new Error('Should not succeed'));
              })
              .catch((err) => {
                should.not.equal(err, null);
                done();
              });
          } catch (e) {
            if (e.message !== 'This method is not supported by this class' && e.message !== 'Not implemented') {
              done(e);
            } else {
              done();
            }
          }
        });

        it(`it should add a new test ${model.name}`, (done) => {
          try {
            const m = model.generateTestData(uow);
            m.add()
              .then((result) => {
                should.not.equal(result, null);
                done();
              })
              .catch(done);
          } catch (e) {
            if (e.message !== 'This method is not supported by this class' && e.message !== 'Not implemented') {
              done(e);
            } else {
              done();
            }
          }
        });
      });

      describe(`Update existing ${model.name}`, () => {
        let obj;
        beforeEach(function (done) {
          try {
            obj = model.generateTestData(uow);
            done();
          } catch (e) {
            this.skip();
          }
        });
        it('should fail validation', (done) => {
          obj = new model({ uid: obj.id }, uow);
          obj.update()
            .then(() => {
              done(new Error('Should not succeed'));
            })
            .catch((err) => {
              should.not.equal(err, null);
              done();
            });
        });

        it('should update the object successfully', (done) => {
          obj.update()
            .then((result) => {
              should.not.equal(result, null);
              done();
            });
        });

        after((done) => {
          if (obj) {
            obj.delete()
              .then(() => done())
              .catch(done);
          } else {
            done();
          }
        });
      });

      describe(`Get count for ${model.name}`, () => {
        it(`it should get all objects of type ${model.name}`, (done) => {
          try {
            model.getCount(model.useRTDB ? uowrtdb : uow)
              .then((result) => {
                expect(result).to.be.a.ReadableStream;
                done();
              }).catch(done);
          } catch (e) {
            if (e.message !== 'This method is not supported by this class' && e.message !== 'Not implemented') {
              done(e);
            } else {
              done();
            }
          }
        });
      })
    });
  });
});
