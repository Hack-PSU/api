const { sqlConnection } = require('../constants');
const MockConnection = require('./mock_connection');

const MysqlUow = require('./mysql_uow');
const mysql = require('mysql');

const dbConnection = mysql.createPool(sqlConnection);

/**
 * Factory abstraction for creating database connection:
 * Use create method in the client and connection will be
 * chosen based on config.
 */
module.exports = class UowFactory {
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
          console.error(`NODE_ENV: ${process.env.NODE_ENV}`);
          throw new Error('NODE_ENV must be set');
      }
    });
  }
}
