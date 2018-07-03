/* eslint-disable import/no-dynamic-require,global-require,no-undef,array-callback-return,new-cap */
const chai = require('chai');
const fs = require('fs');
require('dotenv').config();

process.env.SQL_DATABASE = 'test';
const UowFactory = require('../services/factories/uow_factory');

const modelFiles = fs.readdirSync('./models')
  .map(a => a.replace(/\.js/g, ''))
  .filter(a => a !== 'BaseObject');
const models = modelFiles.map(model => require(`../models/${model}`));

const should = chai.should();

describe('Object retrieval tests', () => {
  let uow;
  let uowrtdb;
  beforeEach((done) => {
    UowFactory.create()
      .then((u) => {
        uow = u;
        done();
      }).catch(err => done(err));
    UowFactory.createRTDB()
      .then((u) => {
        uowrtdb = u;
      }).catch(done);
  });

  afterEach((done) => {
    uow.complete();
    done();
  });
  models.forEach((model) => {
    describe(`Testing ${model.name}`, () => {
      describe(`Get all ${model.name}`, () => {
        it(`it should get all objects of type ${model.name}`, (done) => {
          try {
            model.getAll(model.useRTDB ? uowrtdb : uow)
              .then((result) => {
                result.on('data', (data) => {
                  should.not.equal(data, {});
                });
                result.on('end', () => done());
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
        it(`it should add a new test ${model.name}`, (done) => {
          try {
            const m = model.generateTestData(uow);
            m.add()
              .then((result) => {
                should.not.equal(result, null); // TODO: Add actual test condition
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

      describe(`Update existing ${model.name}`, () => {
        let obj;
        beforeEach(function (done) {
          try {
            const m = model.generateTestData(uow);
            m.add()
              .then((result) => {
                should.not.equal(result, null);
                obj = m;
                done();
              }).catch(done);
          } catch (e) {
            this.skip();
          }
        });
        it('should fail validation', (done) => {
          delete obj.id;
          delete obj[Object.keys(obj).pop()];
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
    });
  });
});
