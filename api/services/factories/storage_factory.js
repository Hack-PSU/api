/* eslint-disable no-param-reassign */
const multers3 = require('multer-s3');
const aws = require('aws-sdk');
const constants = require('../../assets/constants/constants');
const GCSStorageEngine = require('./GCSStorageEngine');

aws.config.update({
  accessKeyId: constants.s3Connection.accessKeyId,
  secretAccessKey: constants.s3Connection.secretAccessKey,
  region: constants.s3Connection.region,
});

// Enumerable for types of storage available
const STORAGE_TYPES = Object.freeze({ GCS: 1, S3: 2 });

const s3 = new aws.S3();

class StorageFactory {
  /**
   *
   * @param opts
   * Possible options:
   *  opts.bucketname
   *  opts.acl
   *  opts.metadata,
   *  opts.encryption
   *  opts.key
   * @returns {S3Storage}
   */
  static S3Storage(opts) {
    if (!opts) {
      opts = {};
    }
    return multers3({
      s3,
      bucket: opts.bucketName || 'my-uploads',
      acl: opts.acl || 'public-read',
      serverSideEncryption: opts.encryption || 'AES256',
      metadata: opts.metadata,
      key: opts.key || ((req, file, cb) => cb(null, file.fieldname)),
    });
  }

  /**
   *
   * @param opts {any}
   * @returns {MulterGoogleCloudStorage}
   */
  static GCStorage(opts) {
    return new GCSStorageEngine({
      autoRetry: true,
      keyFilename: opts.keyFilename || process.env.GOOGLE_APPLICATION_CREDENTIALS,
      projectId: opts.projectId || process.env.GOOGLE_PROJECT_ID,
      bucket: opts.bucketName || process.env.GOOGLE_STORAGE_BUCKET,
      maxRetries: 10,
      filename: opts.key || ((req, file, cb) => cb(null, file.fieldname)),
      metadata: {
        metadata: {
          'Access-Control-Allow-Origin': '*',
        },
        cacheControl: 'public, max-age=3600',
      },
    });
  }
}

module.exports = {
  STORAGE_TYPES,
  StorageFactory,
};
