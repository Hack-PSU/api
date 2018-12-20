import * as express from 'express';
import multer from 'multer';
import { GcsStorageEngine } from '../engines/gcs-storage.engine';
import { IFileUploadLimits } from '../storage-types';
import { IStorageService } from './storage.service';

const MAX_FILENUM = 20;

export class IGoogleStorageService implements IStorageService {

  public get upload(): express.RequestHandler {
    return this._upload;
  }

  public readonly fieldName: string;
  public readonly fileFilter: (file: IStorageService.IFile) => boolean;
  public readonly readMultipleFiles: boolean;
  private fileLimits: IFileUploadLimits;
  private readonly bucket: string;

  private readonly googleStorageEngine: GcsStorageEngine;

  constructor(
    fieldName: string,
    fileFilter: (file: IStorageService.IFile) => boolean = () => true,
    readMultipleFiles: boolean = false,
    gcsOptions: GCSStorageEngine.IGcsStorageEngineOpts,
    fileLimits: IFileUploadLimits,
  ) {
    this.fieldName = fieldName;
    this.fileFilter = fileFilter || null;
    this.readMultipleFiles = readMultipleFiles || false;
    this.googleStorageEngine = new GcsStorageEngine(gcsOptions);
    this.bucket = gcsOptions.bucket;
    this.fileLimits = fileLimits;
  }

  public uploadedFileUrl(name: string) {
    return `https://${this.bucket}.storage.googleapis.com/${name}`;
  }

  private _upload(req: express.Request, res: express.Response, next: express.NextFunction) {
    const limits: IFileUploadLimits = {
      fileSize: 1024 * 1024 * 10,
    };
    const opts: multer.Options = {
      fileFilter: this._fileFilter,
      limits,
      storage: this.googleStorageEngine,
    };
    const uploader = multer(opts);
    if (this.readMultipleFiles) {
      return uploader.array(
        this.fieldName,
        this.fileLimits.maxNumFiles || MAX_FILENUM,
      )(
        req,
        res,
        next,
      );
    }
    return uploader.single(this.fieldName)(req, res, next);
  }

  private _fileFilter(
    req: Express.Request,
    file: Express.Multer.File,
    callback: (error: (Error | null), acceptFile: boolean) => void,
  ) {
    try {
      const result = this.fileFilter(file);
      callback(null, result);
    } catch (error) {
      callback(error, false);
    }
  }
}
