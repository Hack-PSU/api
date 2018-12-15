/* eslint-disable no-param-reassign */
import * as aws from 'aws-sdk';
import * as multers3 from 'multer-s3';

import { GcsStorageEngine } from './engines/gcs-storage.engine';

aws.config.update({
  accessKeyId: constants.s3Connection.accessKeyId,
  region: constants.s3Connection.region,
  secretAccessKey: constants.s3Connection.secretAccessKey,
});

// Enumerable for types of storage available
export const STORAGE_TYPES = Object.freeze({ GCS: 1, S3: 2 });

const s3 = new aws.S3();

// TODO: Change to DI style with interfaces
export class StorageFactory {
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
  public static S3Storage(opts: any = {}) {
    return multers3({
      acl: opts.acl || 'public-read',
      bucket: opts.bucketName || 'my-uploads',
      key: opts.key || ((req, file, cb) => cb(null, file.fieldname)),
      metadata: opts.metadata,
      s3,
      serverSideEncryption: opts.encryption || 'AES256',
    });
  }

  /**
   *
   * @param opts {any}
   * @returns {MulterGoogleCloudStorage}
   */
  public static GCStorage(opts) {
    return new GcsStorageEngine({
      autoRetry: true,
      bucket: opts.bucketName || process.env.GOOGLE_STORAGE_BUCKET,
      filename: opts.key || ((req, file, cb) => cb(null, file.fieldname)),
      keyFilename: opts.keyFilename || process.env.GOOGLE_APPLICATION_CREDENTIALS,
      maxRetries: 10,
      metadata: {
        cacheControl: process.env.GOOGLE_STORAGE_CACHE || 'public, max-age=3600',
        metadata: {
          'Access-Control-Allow-Origin': process.env.GOOGLE_STORAGE_CORS || '*',
        },
      },
      projectId: opts.projectId || process.env.GOOGLE_PROJECT_ID,
    });
  }
}
