// import * as Chance from 'chance';
// import assets      from '../assets/schemas/json-asset-loader';
// import BaseObject  from './BaseObject';
//
// const chance = new Chance();
// const categorySchema = assets('categorySchema');
//
// export const TABLE_NAME = 'CATEGORY_LIST';
//
// export class Category extends BaseObject {
//
//   get schema() {
//     return categorySchema;
//   }
//
//   get tableName() {
//     return TABLE_NAME;
//   }
//
//   public static generateTestData(uow) {
//     const testObj = new Category({}, uow);
//     testObj.categoryName = chance.word();
//     testObj.isSponsor = chance.bool();
//     testObj.uid = chance.integer({ max: 2147483647, min: 0 });
//     return testObj;
//   }
//
//   public static getAll(uow, opts) {
//     return super.getAll(uow, TABLE_NAME, opts);
//   }
//
//   public static getCount(uow) {
//     return super.getCount(uow, TABLE_NAME);
//   }
//
//   private uid: string;
//   private categoryName: string;
//   private isSponsor: boolean;
//
//   /**
//    *
//    * @param data
//    * @param uow {MysqlUow}
//    */
//   constructor(data, uow) {
//     super(uow);
//     this.uid = data.uid || null;
//     this.categoryName = data.category_name || '';
//     this.isSponsor = data.isSponsor || false;
//   }
//
//   protected get id() {
//     return this.uid;
//   }
// };
