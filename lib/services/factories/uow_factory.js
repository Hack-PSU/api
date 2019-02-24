// /* eslint-disable no-underscore-dangle */
// import * as firebase from 'firebase-admin';
// import * as mysql from 'mysql';
// import { Constants } from '../../assets/constants/constants';
// import { Util } from '../../JSCommon/util';
// import { ICacheService } from '../database/cache/cache.service';
// import { MemCacheImpl } from '../database/cache/memcache-impl.service';
// import { RedisCacheImpl } from '../database/cache/redis-impl.service';
// import { MockConnection } from '../database/connection/mock-connection';
// import { MysqlUow } from '../database/svc/mysql-uow.service';
// import { RtdbUow } from '../database/svc/rtdb-uow.service';
//
// import * as serviceAccount from '../../config.json';
//
// const admin = firebase.initializeApp({
//   credential: firebase.credential.cert((serviceAccount as firebase.ServiceAccount)),
//   databaseURL: Constants.firebaseDB.prod,
// });
//
// if (
//   Util.readEnv('INSTANCE_CONNECTION_NAME', '') &&
//   Util.readEnv('NODE_ENV', 'debug') === 'production'
// ) {
//   Constants.sqlConnection.host = '';
// } else {
//   Constants.sqlConnection.socketPath = '';
// }
// const dbConnection = mysql.createPool(sqlConnection);
// MemCacheImpl.init(50);
// RedisCacheImpl.init(null); // TODO: Fix
//
// /**
//  * Factory abstraction for creating database connection:
//  * Use create method in the client and connection will be
//  * chosen based on config.
//  * @Deprecated
//  */
// // TODO: Refactor to work with a DI format
// export class UowFactory {
//   /**
//    * Returns a {MysqlUow} object to the caller based
//    * on environment configurations
//    * @return {Promise<MysqlUow>}
//    */
//   public static create() {
//     return new Promise((resolve, reject) => {
//       let cacheService: ICacheService = null;
//       switch (Util.readEnv('APP_ENV', 'debug')) {
//         case 'NO_DB':
//           cacheService = MemCacheImpl.instance();
//           resolve(new MysqlUow(new MockConnection(), cacheService));
//           break;
//         case 'TEST':
//         case 'test':
//           cacheService = MemCacheImpl.instance();
//         case 'debug':
//         case 'prod':
//         case 'PROD':
//           if (!cacheService) {
//             cacheService = RedisCacheImpl.instance();
//           }
//           dbConnection.getConnection((err, connection) => {
//             if (err) {
//               return reject(err);
//             }
//             return resolve(new MysqlUow(connection, cacheService));
//           });
//           break;
//         default:
//           reject(new Error('APP_ENV must be set and valid'));
//           break;
//       }
//     });
//   }
//
//   /**
//    * Returns a RtdbUow object to the caller
//    * based on environment configuration
//    * @returns {Promise<RtdbUow>}
//    */
//   public static createRTDB() {
//     return new Promise((resolve, reject) => {
//       switch (process.env.APP_ENV) {
//         case 'DEBUG':
//         case 'debug':
//           resolve(new RtdbUow(admin.database(Constants.firebaseDB.debug)));
//           break;
//         case 'test':
//         case 'TEST':
//           resolve(new RtdbUow(admin.database(Constants.firebaseDB.test)));
//           break;
//         case 'prod':
//         case 'PROD':
//           resolve(new RtdbUow(admin.database()));
//           break;
//         default:
//           reject(new Error('APP_ENV must be set'));
//           break;
//       }
//     });
//   }
// }
//# sourceMappingURL=uow_factory.js.map