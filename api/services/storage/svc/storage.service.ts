import * as express from 'express';

export interface IStorageService {
  /*
   Field name to read from request
   */
  fieldName: string;
  /*
    Indicate if reading a single file or multiple from the incoming request
   */
  readMultipleFiles?: boolean;
  /*
    Predicated function that responds if file is legal to upload
    In case of error, this function should throw the error
   */
  fileFilter: (file: IStorageService.IFile) => boolean;
  /*
    Request handler that can be used as middleware
   */
  upload: express.RequestHandler;

  uploadedFileUrl(name: string);
}

declare global {
  namespace IStorageService {
    import ReadStream = NodeJS.ReadStream;

    interface IFile {
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
      stream?: ReadStream;
    }
  }
}
