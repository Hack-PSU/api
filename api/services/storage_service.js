/* eslint no-underscore-dangle: [2, { "allowAfterThis": true }] */
const multer = require('multer');
const { s3Connection } = require('../assets/constants/constants');
const { STORAGE_TYPES, StorageFactory } = require('./factories/storage_factory');

module.exports = class StorageService {
  constructor(storageType, opts) {
    if (!storageType) {
      throw new Error('Storage type must be provided.');
    }

    switch (storageType) {
      case STORAGE_TYPES.GCS:
        this._storage = StorageFactory.GCStorage(opts);
        break;
      case STORAGE_TYPES.S3:
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

  /**
   *
   * @param name Name of the file
   */
  uploadedFileUrl(name) {
    switch (this.storage) {
      case STORAGE_TYPES.S3:
        return `https://s3.${s3Connection.region}.amazonaws.com/${s3Connection.s3BucketName}/${name}`;
      case STORAGE_TYPES.GCS:
        return `https://storage.googleapis.com/${this.storage.bucket}/${name}`;
      default:
        return '';
    }
  }
};
