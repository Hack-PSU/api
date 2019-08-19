import * as express from 'express';
import multer from 'multer';
import { GcsStorageEngine } from '../engines/gcs-storage.engine';
import { IFile, IFileUploadLimits, IStorageMapperParams } from '../storage-types';
import { IStorageMapper } from '../svc/storage.service';

export type FileFilter = (file: IFile) => boolean;
const MAX_FILENUM = 20;

export class GcsMapper implements IStorageMapper {

  /**
   * All properties
   * @VisibleForTesting
   */
  public storageEngine: GcsStorageEngine;
  public fileFilter: FileFilter;
  public multipleFiles: boolean;
  public fileLimits: IFileUploadLimits;
  public fieldName: string;
  public bucket: string;

  constructor(storageMapperParams?: IStorageMapperParams) {
    this.fileFilter = () => true;
    if (storageMapperParams) {
      this.storageEngine = new GcsStorageEngine(storageMapperParams.opts);
      this.fileFilter = storageMapperParams.fileFilter;
      this.multipleFiles = storageMapperParams.multipleFiles;
      this.fileLimits = storageMapperParams.fileLimits;
      this.fieldName = storageMapperParams.fieldName;
      this.bucket = storageMapperParams.opts.bucket;
    }
  }

  public upload() {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const limits: IFileUploadLimits = {
        fileSize: 1024 * 1024 * 10,
      };
      Object.assign(limits, this.fileLimits);
      const multerOpts: multer.Options = {
        fileFilter: this.multerFileFilter(this.fileFilter),
        limits,
        storage: this.storageEngine,
      };
      const uploader = multer(multerOpts);
      if (this.multipleFiles) {
        return uploader.array(
          this.fieldName,
          this.fileLimits.maxNumFiles || MAX_FILENUM,
        )(req, res, next);
      }
      return uploader.single(this.fieldName)(req, res, next);
    };
  }

  /**
   * @VisibleForTesting
   */
  public multerFileFilter(fileFilter: (file: IFile) => boolean) {
    return (
      req: Express.Request,
      file: Express.Multer.File,
      callback: (error: (Error | null), acceptFile: boolean) => void,
    ) => {
      try {
        const result = fileFilter(file as IFile);
        callback(null, result);
      } catch (error) {
        callback(error, false);
      }
    };
  }

  public uploadedFileUrl(name: string) {
    return encodeURI(`https://${this.bucket}.storage.googleapis.com/${name}`);
  }
}
