import Storage from '@google-cloud/storage';
import * as express from 'express';
import * as multer from 'multer';
import { IFile, IGcsStorageEngineOpts } from '../storage-types';

export class GcsStorageEngine implements multer.StorageEngine {
  private gcobj: Storage.Storage;
  private gcsBucket: Storage.Bucket;
  private readonly filenameGenerator: (req: express.Request, file: any) => string;
  private metadata: Storage.WriteStreamOptions;

  constructor(opts: IGcsStorageEngineOpts) {
    this.gcobj = Storage({
      keyFilename: opts.keyFilename,
      projectId: opts.projectId,
    });
    this.gcsBucket = this.gcobj.bucket(opts.bucket);
    this.filenameGenerator = opts.filename || ((req, file1) => file1.fieldname);
    this.metadata = opts.metadata || {
      predefinedAcl: 'private',
    };
  }

  public _handleFile(
    req: express.Request,
    file: IFile,
    cb: (error?: Error, info?: Partial<IFile>) => void,
  ) {
    try {
      const filename = this.filenameGenerator(req, file);
      const gcFile = this.gcsBucket.file(filename);
      return file.stream.pipe(gcFile.createWriteStream(this.metadata))
        .on('error', (err) => cb(err))
        .on('finish', () => cb(undefined, {
          filename,
          path: `https://${this.gcsBucket.name}.storage.googleapis.com/${filename}`,
        }));
    } catch (error) {
      cb(error);
    }
  }

  public _removeFile(
    req: express.Request,
    file: IFile,
    cb: (error: Error) => void,
  ) {
    const gcFile = this.gcsBucket.file(file.filename);
    gcFile.delete()
      .then(() => cb(new Error('successfully deleted')))
      .catch(err => cb(err));
  }
}
