/* eslint-disable global-require */
const database = require('../../../lib/services/database');
const chai = require('chai');
const sinon = require('sinon');
const MysqlUow = require('../../services/mysql_uow');
const RtdbUow = require('../../services/rtdb_uow');
const { Readable } = require('stream');
const chaiStream = require('chai-stream');

chai.use(chaiStream);
const { expect } = chai;

/** ****** HELPER FUNCTIONS ******** */

describe('TEST: Database service', () => {
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

  describe('TEST: Extra credit class list', () => {
    it('Succeeds.', async () => {
      const result = await database.getExtraCreditClassList(uow);
      expect(result).to.be.a.ReadableStream;
    });
  });

  describe('TEST: Assign extra credit', () => {
    it('Succeeds.', async () => {
      const uid = 'uid';
      const classId = 'class-id';
      const result = await database.assignExtraCredit(uow, uid, classId);
      expect(result).to.be.an('array');
    });
  });

  describe('TEST: Write message to Pi', () => {
    it('Succeeds', async () => {
      const message = 'fake-message';
      const result = await database.writePiMessage(uow, message);
      expect(result).to.be.an('array');
    });
  });

  describe('TEST: Store IP', () => {
    it('Succeeds', async () => {
      const ipAddress = 'fake-IP';
      const userAgent = 'fake-agent';
      const result = await database.storeIP(uow, ipAddress, userAgent);
      expect(result).to.be.an('array');
    });
  });

  describe('TEST: Save email history', () => {
    it('Succeeds', async () => {
      const successes = [{}, {}, {}];
      const failures = [{}, {}, {}];
      const result = await database.addEmailsHistory(uow, successes, failures);
      expect(result).to.be.an('array');
    });
  });

  describe('TEST: Add RFID Assignments', () => {
    it('Succeeds', async () => {
      const assignments = [{ rfid: '', uid: '', time: Date.now() }, {
        rfid: '',
        uid: '',
        time: Date.now()
      }, { rfid: '', uid: '', time: Date.now() }];
      const result = await database.addRfidAssignments(uow, assignments);
      expect(result).to.be.an('array');
    });
  });

  describe('TEST: Add RFID Scans', () => {
    it('Succeeds', async () => {
      const scans = [{}, {}, {}];
      const result = await database.addRfidScans(uow, scans);
      expect(result).to.be.an('array');
    });
  });

  describe('TEST: Get all users list', () => {
    it('Succeeds', async () => {
      const result = await database.getAllUsersList(uow);
      expect(result).to.be.a.ReadableStream;
    });
  });

  describe('TEST: Get all users count', () => {
    it('Succeeds', async () => {
      const result = await database.getAllUsersCount(uow);
      expect(result).to.deep.equal([{}, {}]);
    });
  });
});
