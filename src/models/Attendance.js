// import { IUowOpts } from '../services/database/svc/uow.service';
//
// /* eslint-disable class-methods-use-this */
// import BaseObject from './BaseObject';
//
// export const TABLE_NAME = 'ATTENDANCE';
//
// /**
//  * TODO: Add documentation
//  */
// export class Attendance extends BaseObject {
//
//   get tableName() {
//     return TABLE_NAME;
//   }
//
//   public static generateTestData(): void {
//     throw new Error('This method is not supported by this class');
//   }
//
//   /**
//    *
//    * @param uow
//    * @param opts
//    * @return {Promise<Stream>}
//    */
//   public static getAll(uow) {
//     return super.getAll(uow, TABLE_NAME);
//   }
//
//   /**
//    * Returns a count of the number of Attendance objects.
//    * @param uow
//    * @returns {Promise<Readable>}
//    */
//   public static getCount(uow) {
//     return super.getCount(uow, TABLE_NAME);
//   }
//   constructor(data, uow) {
//     super(uow);
//   }
//
//   public add(opts?: IUowOpts): Promise<any> | Promise<never> | Promise<any> {
//     throw new Error('This method is not supported by this class');
//   }
//
//   public update(opts?: IUowOpts): Promise<any> | Promise<any> | Promise<any> {
//     throw new Error('This method is not supported by this class');
//   }
//
//   public delete(opts?: IUowOpts): Promise<any> | Promise<any> {
//     throw new Error('This method is not supported by this class');
//   }
//
//   protected get id() {
//     throw new Error('This method is not supported by this class');
//   }
//
//   protected get schema(): any {
//     throw new Error('This method is not supported by this class');
//   }
// }
