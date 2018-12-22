import * as express from 'express';
import { IFile, IFileUploadLimits, IStorageEngineOpts } from '../storage-types';

export interface IStorageService {
  /*
   Field name to read from request
   */
  fieldName: string | undefined;
  /*
    Indicate if reading a single file or multiple from the incoming request
   */
  readMultipleFiles?: boolean | undefined;
  /*
    Predicated function that responds if file is legal to upload
    In case of error, this function should throw the error
   */
  fileFilter: ((file: IFile) => boolean) | undefined;
  /*
    Request handler that can be used as middleware
   */
  upload: express.RequestHandler;

  uploadedFileUrl(name: string);

  setGcsOpts(opts: IStorageEngineOpts): IStorageService;

  setFieldName(fieldName: string): this;

  setFileFilter(fileFilter: (file: IFile) => boolean): IStorageService;

  setReadMultipleFiles(readMultipleFiles: boolean): IStorageService;

  setBucket(bucket: string): IStorageService;

  setFileLimits(fileLimits: IFileUploadLimits): IStorageService;
}

