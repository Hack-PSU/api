const mysql = require('mysql');
const firebase = require('firebase-admin');
const { sqlConnection, firebaseDB } = require('../../assets/helpers/constants/constants');
const MockConnection = require('../mock_connection');
const MysqlUow = require('../mysql_uow');
const RtdbUow = require('../rtdb_uow');

const dbConnection = mysql.createPool(sqlConnection);

const serviceAccount = require('../../config.json');

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
   * Returns a {MysqlUow} object to the caller based
   * on environment configurations
   * @return {Promise<MysqlUow>}
   */
  static create() {
    return new Promise((resolve, reject) => {
      switch (process.env.APP_ENV) {
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
          reject(new Error('APP_ENV must be set'));
          break;
      }
    });
  }

  /**
   * Returns a RtdbUow object to the caller
   * based on environment configuration
   * @returns {Promise<RtdbUow>}
   */
  static createRTDB() {
    return new Promise((resolve, reject) => {
      switch (process.env.APP_ENV) {
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
          reject(new Error('APP_ENV must be set'));
          break;
      }
    });
  }
};
