import * as express from 'express';
import { IStorageMapperParams } from '../storage-types';

export interface IStorageMapper {
  /*
   Request handler that can be used as middleware
   */
  upload(): express.RequestHandler;

  /**
   * Return the URL for an uploaded file
   */
  uploadedFileUrl(name: string);

  /**
   * Download a certain file
   */
  // download();
}

export interface IStorageService {
  mapper(storageParams: IStorageMapperParams): IStorageMapper;
}
