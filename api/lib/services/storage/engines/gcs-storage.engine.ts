import * as Storage from '@google-cloud/storage';
import * as express from 'express';
import * as multer from 'multer';

export class GcsStorageEngine implements multer.StorageEngine {
  private gcobj: Storage.Storage;
  private gcsBucket: Storage.Bucket;
  private readonly filenameGenerator: (req: express.Request, file: any) => string;
  private metadata: Storage.WriteStreamOptions;

  constructor(opts: GCSStorageEngine.IGcsStorageEngineOpts) {
    if (!opts) {
      throw new Error('Cannot pass null options');
    }
    this.gcobj = storage({
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
    file: IStorageService.IFile,
    cb: (error?: Error, info?: Partial<IStorageService.IFile>) => void,
  ) {
    try {
      const filename = this.filenameGenerator(req, file);
      const gcFile = this.gcsBucket.file(filename);
      return file.stream.pipe(gcFile.createWriteStream(this.metadata))
        .on('error', (err) => cb(err))
        .on('finish', () => cb(null, {
          filename,
          path: `https://${this.gcsBucket.name}.storage.googleapis.com/${filename}`,
        }));
    } catch (error) {
      cb(error);
    }
  }

  public _removeFile(
    req: express.Request,
    file: IStorageService.IFile,
    cb: (error: Error) => void,
  ) {
    const gcFile = this.gcsBucket.file(file.filename);
    gcFile.delete()
      .then(() => cb(null))
      .catch(err => cb(err));
  }
}

declare global {
  namespace GCSStorageEngine {
    interface IGcsStorageEngineOpts {
      /*
       GCS Bucket to use
       */
      bucket: string;
      /*
       Project on Google Cloud platform
       */
      projectId: string;
      /*
       Name of file containing private key
       */
      keyFilename: string;
      /*
       Name of file to upload
       */
      filename?: (req: express.Request, file: any) => string;
      metadata?: Storage.WriteStreamOptions;
    }
  }
}
