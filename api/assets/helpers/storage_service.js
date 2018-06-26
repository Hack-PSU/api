/* eslint no-underscore-dangle: [2, { "allowAfterThis": true }] */
const multer = require('multer');
// const multers3 = require('multer-s3');
// const aws = require('aws-sdk');
// const constants = require('./constants');
const { STORAGE_TYPE, StorageFactory } = require('./storage_factory');

// aws.config.update({
//   accessKeyId: constants.s3Connection.accessKeyId,
//   secretAccessKey: constants.s3Connection.secretAccessKey,
//   region: constants.s3Connection.region,
// });
//
// const s3 = new aws.S3();

module.exports = class StorageService {
  constructor(storageType, opts) {
    if (!storageType) {
      throw new Error('Storage type must be provided.');
    }

    switch (storageType) {
      case STORAGE_TYPE.GCS:
        this._storage = StorageFactory.GCStorage(opts);
        break;
      case STORAGE_TYPE.S3:
        this._storage = StorageFactory.S3Storage(opts);
        break;
      default:
        throw new Error('Illegal storage value.');
    }
    this._storage = storageType;
  }

  get storage() {
    return this._storage;
  }

  /**
   *
   * @param opts
   * @returns {Multer}
   */
  upload(opts) {
    const multerOpts = {};
    multerOpts.storage = opts.storage || this.storage;
    multerOpts.fileFilter = opts.fileFilter ? opts.fileFilter : null;
    multerOpts.limits = opts.limits ? opts.limits : { fileSize: 1024 * 1024 * 10 };
    return multer(multerOpts);
  }
};


/**
 *
 * @param opts {Object} The opts object uses three parameters:
 *                        fileFilter: A function that controls which files are accepter
 *                        storage: The destination to store the file. Defaults to /tmp/my-uploads
 *                        limits: Limits to the uploaded file such as fileSize, files, etc.
 *                        See multerjs docs for more details
 * @returns {Multer}
 */
// function upload(opts) {
//   const multerOpts = {};
//   multerOpts.storage = opts.storage || multer.memoryStorage();
//   multerOpts.fileFilter = opts.fileFilter ? opts.fileFilter : null;
//   multerOpts.limits = opts.limits ? opts.limits : { fileSize: 1024 * 1024 * 10 };
//   return multer(multerOpts);
// }

/**
 *
 * @param opts {Object} The opts object takes multiple parameters:
 *                        bucketName: Name of the bucket to store data in. Default: my-uploads
 *                        acl: ACL permission for the uploaded file. Default: 'public-read'
 *                        encryption: Server side encryption to use. Default: 'AES256'
 *                        metadata {Function}: function (req, file, cb)
 *                                Takes the request object, file, and a callback.
 *                                Sets the metadata for the provided file.
 *                                The callback must be called with (error, metadata)
 *                        key {Function}: function(req, file, cb)
 *                                Takes the request object, file, and a callback.
 *                                Sets the key for the file.
 *                                The callback must be called with (error, key)
 *                                By default, it sets the files fieldname as key
 * @returns {S3Storage}
 */
// function generateStorage(opts) {
//   return multers3({
//     s3,
//     bucket: opts.bucketName ? opts.bucketName : 'my-uploads',
//     acl: opts.acl ? opts.acl : 'public-read',
//     serverSideEncryption: opts.encryption ? opts.encryption : 'AES256',
//     metadata: opts.metadata,
//     key: opts.key ? opts.key : ((req, file, cb) => cb(null, file.fieldname)),
//   });
// }

// module.exports = {
//   upload,
//   generateStorage,
// };
