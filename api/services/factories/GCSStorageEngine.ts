import * as storage from '@google-cloud/storage';
import * as uuid from 'uuid';

// TODO: Cleanup
export class GCSStorageEngine {
  private gcobj: storage.Storage;
  private gcsBucket: storage.Bucket;
  private options: any;

  constructor(opts: any = {}) { // TODO: Define opts

    this.getFilename = opts.filename || this.getFilename;

    opts.bucket = opts.bucket || process.env.GCS_BUCKET || null;
    opts.projectId = opts.projectId || process.env.GCLOUD_PROJECT || null;
    opts.keyFilename = opts.keyFilename || process.env.GCS_KEYFILE || null;

    if (!opts.bucket) {
      throw new Error('You have to specify bucket for Google Cloud Storage to work.');
    }

    if (!opts.projectId) {
      throw new Error('You have to specify project id for Google Cloud Storage to work.');
    }

    if (!opts.keyFilename) {
      throw new Error('You have to specify credentials key file for Google Cloud Storage to work.');
    }

    this.gcobj = storage({
      keyFilename: opts.keyFilename,
      projectId: opts.projectId,
    });
    this.gcsBucket = this.gcobj.bucket(opts.bucket);
    this.options = opts;
  }
  public getFilename(req, file, cb) {
    cb(null, `${uuid()}_${file.originalname}`);
  }

  public _handleFile(req, file, cb) {
    this.getFilename(req, file, (err, filename) => {
      if (err) {
        return cb(err);
      }
      const gcFile = this.gcsBucket.file(filename);
      return file.stream.pipe(gcFile.createWriteStream({
        metadata: this.options.metadata,
        predefinedAcl: this.options.acl || 'private',
      }))
        .on('error', (err) => cb(err))
        .on('finish', () => cb(null, {
          filename,
          path: `https://${this.options.bucket}.storage.googleapis.com/${filename}`,
        }));
    });
  }

  public _removeFile(req, file, cb) {
    const gcFile = this.gcsBucket.file(file.filename);
    gcFile.delete()
      .then(data => cb(null, data))
      .catch(err => cb(err, null));
  }
};
