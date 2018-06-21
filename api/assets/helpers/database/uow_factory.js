const mysql = require('mysql');
const firebase = require('firebase-admin');
const nodecipher = require('node-cipher');

const { sqlConnection, firebaseDB } = require('../constants');
const MockConnection = require('./mock_connection');

const MysqlUow = require('./mysql_uow');
const RtdbUow = require('./rtdb_uow');

const dbConnection = mysql.createPool(sqlConnection);

nodecipher.decryptSync({
  input: 'privatekey.aes',
  output: 'config.json',
  password: process.env.PKEY_PASS,
  algorithm: 'aes-256-cbc-hmac-sha256',
});

const serviceAccount = require('../../../config.json');

const admin = firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: firebaseDB.prod,
});

/**
 * Factory abstraction for creating database connection:
 * Use create method in the client and connection will be
 * chosen based on config.
 */
module.exports = class UowFactory {
  /**
   *
   * @return {Promise<MysqlUow>}
   */
  static create() {
    return new Promise((resolve, reject) => {
      switch (process.env.NODE_ENV) {
        case 'DEBUG':
        case 'debug':
          resolve(new MysqlUow(new MockConnection()));
          break;
        case 'TEST':
        case 'test':
        case 'prod':
        case 'PROD':
          dbConnection.getConnection((err, connection) => {
            if (err) {
              reject(err);
            } else {
              resolve(new MysqlUow(connection));
            }
          });
          break;
        default:
          reject(new Error('NODE_ENV must be set'));
          break;
      }
    });
  }

  /**
   *
   * @returns {Promise<RtdbUow>}
   */
  static createRTDB() {
    return new Promise((resolve, reject) => {
      switch (process.env.NODE_ENV) {
        case 'DEBUG':
        case 'debug':
          resolve(new RtdbUow(admin.database(firebaseDB.debug)));
          break;
        case 'test':
        case 'TEST':
          resolve(new RtdbUow(admin.database(firebaseDB.test)));
          break;
        case 'prod':
        case 'PROD':
          resolve(new RtdbUow(admin.database()));
          break;
        default:
          reject(new Error('NODE_ENV must be set'));
      }
    });
  }
};