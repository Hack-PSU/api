import { expect } from 'chai';
import 'mocha';
import { mockReq, mockRes } from 'sinon-express-mock';
import { GcsStorageEngine } from '../../../../src/services/storage/engines/gcs-storage.engine';
import { GcsMapper } from '../../../../src/services/storage/mapper/gcs-mapper';
import { IFile } from '../../../../src/services/storage/storage-types';
import { GoogleStorageService } from '../../../../src/services/storage/svc/google-storage.service';

describe('TEST: Google Storage Mapper', () => {
  describe('TEST: File filter', () => {
    it('properly allows and blocks files passing the filter', async () => {
      // GIVEN: Google Storage Mapper instance
      const storageService = new GcsMapper();
      // GIVEN: Legal and illegal file
      const testFileName = 'test file name';
      const legalFile: IFile = {
        buffer: Buffer.allocUnsafe(0),
        destination: '',
        encoding: '',
        fieldname: '',
        filename: testFileName,
        mimetype: '',
        originalname: '',
        path: '',
        size: 0,
        stream: process.stdin,
      };
      const illegalFile: IFile = {
        buffer: Buffer.allocUnsafe(0),
        destination: '',
        encoding: '',
        fieldname: '',
        filename: '',
        mimetype: '',
        originalname: '',
        path: '',
        size: 0,
        stream: process.stdin,
      };
      // WHEN: checking if file should be allowed with default filter
      let result = storageService.fileFilter(illegalFile);
      expect(result).to.equal(true);

      // GIVEN: Specific file filter
      storageService.fileFilter = file => file.filename === testFileName;

      // WHEN: checking if file should be allowed
      // @ts-ignore
      result = storageService.fileFilter(legalFile);
      expect(result).to.equal(true);

      // WHEN: checking if illegal file should be allowed
      // @ts-ignore
      result = storageService.fileFilter(illegalFile);
      expect(result).to.equal(false);
    });
  });

  it('handles filter errors gracefully', () => {
      // GIVEN: Google Storage Mapper instance
    const storageService = new GcsMapper();
      // GIVEN: Specific file filter that throws error
    storageService.fileFilter = (() => {
      throw new Error('test error');
    });
      // GIVEN: Legal file
    const legalFile: IFile = {
      buffer: Buffer.allocUnsafe(0),
      destination: '',
      encoding: '',
      fieldname: '',
      filename: 'test file name',
      mimetype: '',
      originalname: '',
      path: '',
      size: 0,
      stream: process.stdin,
    };

    // WHEN: checking if file should be allowed
    try {
      storageService.fileFilter(legalFile);
    } catch (error) {
      expect(error).to.not.equal(undefined);
      return;
    }
    // Should not occur
    expect(true).to.equal(false);
  });
});

describe('TEST: File URL generator', () => {
  it('generates the expected URL for the file', () => {
      // GIVEN: bucket name, expected URL
    const bucketName = 'test bucket';
    const filename = 'test file';
    const expectedUrl = 'https://test%20bucket.storage.googleapis.com/test%20file';
      // GIVEN: Google Storage Mapper instance
    const storageService = new GcsMapper();
      // GIVEN: particular bucket name
    storageService.bucket = ('test bucket');

      // WHEN: retrieved file url
    const url = storageService.uploadedFileUrl(filename);
    expect(url).to.equal(expectedUrl);
  });
});

describe('TEST: upload middleware', () => {
  it('responds with the correct middleware for single file upload', (done) => {
      // GIVEN: bucket name, project name, file name, field name
    const testBucket = 'test bucket';
    const testProject = 'test project';
    const testFilename = 'test filename';
    const testFieldName = 'test field name';
      // GIVEN: Google Storage Mapper Instance
    const storageService = new GcsMapper();
    storageService.storageEngine = new GcsStorageEngine({
      bucket: testBucket,
      keyFilename: testFilename,
      projectId: testProject,
      filename: () => Promise.resolve('test file name'),
    });
    storageService.fieldName = testFieldName;
      // GIVEN: single file to upload
    const file: IFile = {
      buffer: Buffer.allocUnsafe(0),
      destination: '',
      encoding: '',
      fieldname: '',
      filename: 'test file name',
      mimetype: '',
      originalname: '',
      path: '',
      size: 0,
      stream: process.stdin,
    };
      // GIVEN: mock request
    const req = mockReq();
    req.headers = {};
    req.headers['transfer-encoding'] = '';
      // WHEN: file is uploaded
    storageService.upload()(req, mockRes(), (error) => {
        // THEN: error is null
      expect(error).to.equal(undefined);
      done();
    });
  });

  it('responds with the correct middleware for multiple file upload', (done) => {
      // GIVEN: bucket name, project name, file name, field name
    const testBucket = 'test bucket';
    const testProject = 'test project';
    const testFilename = 'test filename';
    const testFieldName = 'test field name';
    const testNumFiles = 2;
      // GIVEN: Google Storage Mapper Instance
    const storageService = new GcsMapper();
    storageService.storageEngine = new GcsStorageEngine({
      bucket: testBucket,
      keyFilename: testFilename,
      projectId: testProject,
      filename: () => Promise.resolve('test file name'),
    });
    storageService.fieldName = testFieldName;
    storageService.multipleFiles = true;
    storageService.fileLimits = { fileSize: 0, maxNumFiles: 2 };
      // GIVEN: single file to upload
    const file: IFile = {
      buffer: Buffer.allocUnsafe(0),
      destination: '',
      encoding: '',
      fieldname: '',
      filename: 'test file name',
      mimetype: '',
      originalname: '',
      path: '',
      size: 0,
      stream: process.stdin,
    };
      // GIVEN: mock request
    const req = mockReq();
    req.headers = {};
    req.headers['transfer-encoding'] = '';
      // WHEN: file is uploaded
    storageService.upload()(req, mockRes(), (error) => {
        // THEN: error is null
      expect(error).to.equal(undefined);
      done();
    });
  });
});
