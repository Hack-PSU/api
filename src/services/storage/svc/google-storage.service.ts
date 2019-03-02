import * as express from 'express';
import { Injectable } from 'injection-js';
import multer from 'multer';
import 'reflect-metadata';
import { GcsStorageEngine } from '../engines/gcs-storage.engine';
import { IFile, IFileUploadLimits, IGcsStorageEngineOpts } from '../storage-types';
import { IStorageService } from './storage.service';

const MAX_FILENUM = 20;

@Injectable()
export class GoogleStorageService implements IStorageService {

  public get upload(): express.RequestHandler {
    return this._upload;
  }

  public fieldName: string | undefined;
  public fileFilter: ((file: IFile) => boolean) | undefined;
  public readMultipleFiles: boolean | undefined;
  private fileLimits: IFileUploadLimits | undefined;
  private bucket: string | undefined;
  private googleStorageEngine: GcsStorageEngine | undefined;

  constructor() {
    this.setFileFilter();
    this.setReadMultipleFiles();
  }

  public setGcsOpts(gcsOptions: IGcsStorageEngineOpts) {
    this.bucket = gcsOptions.bucket;
    this.googleStorageEngine = new GcsStorageEngine(gcsOptions);
    return this;
  }

  public setFieldName(fieldName: string): this {
    this.fieldName = fieldName;
    return this;
  }

  public setFileFilter(fileFilter: (file: IFile) => boolean = () => true) {
    this.fileFilter = fileFilter;
    return this;
  }

  public setReadMultipleFiles(readMultipleFiles: boolean = false) {
    this.readMultipleFiles = readMultipleFiles;
    return this;
  }

  public setBucket(bucket: string) {
    this.bucket = bucket;
    return this;
  }

  public setFileLimits(fileLimits: IFileUploadLimits) {
    this.fileLimits = fileLimits;
    return this;
  }

  public uploadedFileUrl(name: string) {
    return encodeURI(`https://${this.bucket!}.storage.googleapis.com/${name}`);
  }

  /**
   * @VisibleForTesting
   */
  public _fileFilter(
    req: Express.Request,
    file: Express.Multer.File,
    callback: (error: (Error | null), acceptFile: boolean) => void,
  ) {
    try {
      const result = this.fileFilter!(file as IFile);
      callback(null, result);
    } catch (error) {
      callback(error, false);
    }
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
        this.fieldName!,
        this.fileLimits!.maxNumFiles || MAX_FILENUM,
      )(req, res, next);
    }
    return uploader.single(this.fieldName)(req, res, next);
  }
}
