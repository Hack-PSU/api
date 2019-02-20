// tslint:disable-next-line:import-name
import Storage from '@google-cloud/storage';
import * as express from 'express';

export interface IFileUploadLimits {
  /** Max field name size (Default: 100 bytes) */
  fieldNameSize?: number;
  /** Max field value size (Default: 1MB) */
  fieldSize?: number;
  /** Max number of non- file fields (Default: Infinity) */
  fields?: number;
  /** For multipart forms, the max file size (in bytes)(Default: Infinity) */
  fileSize?: number;
  /** For multipart forms, the max number of file fields (Default: Infinity) */
  files?: number;
  /** For multipart forms, the max number of parts (fields + files)(Default: Infinity) */
  parts?: number;
  /* * For multipart forms, the max number of header key=> value pairs to parse Default:
   *  2000(same as node's http).
   *  */
  headerPairs?: number;
  /** Keep the full path of files instead of just the base name (Default: false) */
  preservePath?: boolean;
  /** Maximum number of files to read in case of array upload */
  maxNumFiles?: number;
}

export interface IStorageEngineOpts {
  /*
   Name of file to upload
   */
  filename?: (req: express.Request, file: any) => string;
}

export interface IGcsStorageEngineOpts extends IStorageEngineOpts {
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

  metadata?: Storage.WriteStreamOptions;
}

import ReadStream = NodeJS.ReadStream;

export interface IFile {
  /** Field name specified in the form */
  fieldname: string;
  /** Name of the file on the user's computer */
  originalname: string;
  /** Encoding type of the file */
  encoding: string;
  /** Mime type of the file */
  mimetype: string;
  /** Size of the file in bytes */
  size: number;
  /** The folder to which the file has been saved (DiskStorage) */
  destination: string;
  /** The name of the file within the destination (DiskStorage) */
  filename: string;
  /** Location of the uploaded file (DiskStorage) */
  path: string;
  /** A Buffer of the entire file (MemoryStorage) */
  buffer: Buffer;
  stream: ReadStream;
}
