const storage = require('@google-cloud/storage');
const uuid = require('uuid/v4');

module.exports = class GCSStorageEngine {
  getFilename(req, file, cb) {
    cb(null, `${uuid()}_${file.originalname}`);
  }

  constructor(opts) {
    opts = opts || {};

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
      projectId: opts.projectId,
      keyFilename: opts.keyFilename,
    });
    this.gcsBucket = this.gcobj.bucket(opts.bucket);
    this.options = opts;
  }

  _handleFile(req, file, cb) {
    this.getFilename(req, file, (err, filename) => {
      if (err) {
        return cb(err);
      }
      const gcFile = this.gcsBucket.file(filename);
      return file.stream.pipe(gcFile.createWriteStream({
        predefinedAcl: this.options.acl || 'private',
        metadata: this.options.metadata,
      }))
        .on('error', (err) => cb(err))
        .on('finish', () => cb(null, {
          path: `https://${this.options.bucket}.storage.googleapis.com/${filename}`,
          filename,
        }));
    });
  }

  _removeFile(req, file, cb) {
    const gcFile = this.gcsBucket.file(file.filename);
    gcFile.delete()
      .then(data => cb(null, data))
      .catch(err => cb(err, null));
  }
};
