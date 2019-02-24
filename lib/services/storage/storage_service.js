// /* eslint no-underscore-dangle: [2, { "allowAfterThis": true }] */
// import multer from 'multer';
// import { Constants } from '../../assets/constants/constants';
// import { STORAGE_TYPES, StorageFactory } from './storage-factory';
//
// /**
//  * @Deprecated
//  */
// export class StorageService {
//   private storageType: any;
//   private bucket: string;
//   private storageInternal: any;
//
//   constructor(storageType, opts) {
//     if (!storageType) {
//       throw new Error('Storage type must be provided.');
//     }
//
//     this.storageType = storageType;
//     this.bucket = opts.bucketName;
//     switch (storageType) {
//       case STORAGE_TYPES.GCS:
//         this.storageInternal = StorageFactory.GCStorage(opts);
//         break;
//       case STORAGE_TYPES.S3:
//         this.storageInternal = StorageFactory.S3Storage(opts);
//         break;
//       default:
//         throw new Error('Illegal storage value.');
//     }
//   }
//
//   get storage() {
//     return this.storageInternal;
//   }
//
//   /**
//    *
//    * @param opts
//    * @returns {Multer}
//    */
//   public upload(opts) {
//     const multerOpts: multer.Options = {};
//     multerOpts.storage = opts.storage || this.storage;
//     multerOpts.fileFilter = opts.fileFilter ? opts.fileFilter : null;
//     multerOpts.limits = opts.limits ? opts.limits : { fileSize: 1024 * 1024 * 10 };
//     // multerOpts.acl = opts.acl || 'privateRead';
//     return multer(multerOpts);
//   }
//
//   /**
//    *
//    * @param name Name of the file
//    */
//   public uploadedFileUrl(name) {
//     switch (this.storageType) {
//       case STORAGE_TYPES.S3:
//         return `https://s3.${Constants.s3Connection.region}.amazonaws.com/${
//           Constants.s3Connection.s3BucketName}/${name}`;
//       case STORAGE_TYPES.GCS:
//         return `https://storage.googleapis.com/${this.bucket}/${name}`;
//       default:
//         return '';
//     }
//   }
// }
//# sourceMappingURL=storage_service.js.map