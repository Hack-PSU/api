import { expect } from 'chai';
import 'mocha';
import { mockReq, mockRes } from 'sinon-express-mock';
import { IFile } from '../../../../lib/services/storage/storage-types';
import { GoogleStorageService } from '../../../../lib/services/storage/svc/google-storage.service';

describe('TEST: Google Storage Service', () => {
  describe('TEST: File filter', () => {
    it('properly allows and blocks files passing the filter', (done) => {
      // GIVEN: Google Storage Service instance
      const storageService = new GoogleStorageService();
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
      // WHEN: checking if file should be allowed
      // @ts-ignore
      storageService._fileFilter(mockReq(), illegalFile, (error, result) => {
        if (error) {
          return done(error);
        }
        // THEN: file is allowed
        if (!result) {
          return done(result);
        }

        // GIVEN: Specific file filter
        storageService.setFileFilter((file) => file.filename === testFileName);

        // WHEN: checking if file should be allowed
        // @ts-ignore
        storageService._fileFilter(mockReq(), legalFile, (error1, result1) => {
          if (error1) {
            return done(error1);
          }
          // THEN: file is allowed
          if (!result1) {
            return done(result1);
          }

          // WHEN: checking if illegal file should be allowed
          // @ts-ignore
          storageService._fileFilter(mockReq(), illegalFile, (error2, result2) => {
            if (error2) {
              return done(error2);
            }
            // THEN: file is allowed
            if (result2) {
              return done(result2);
            }
            return done();
          });
        });
      });
    });

    it('handles filter errors gracefully', (done) => {
      // GIVEN: Google Storage Service instance
      const storageService = new GoogleStorageService();
      // GIVEN: Specific file filter that throws error
      storageService.setFileFilter((file) => {
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
      // @ts-ignore
      storageService._fileFilter(mockReq(), legalFile, (error, result) => {
        // THEN: error is handled and file is denied
        if (result) {
          done(result);
        }
        if (error) {
          done();
        }
      });
    });
  });

  describe('TEST: File URL generator', () => {
    it('generates the expected URL for the file', () => {
      // GIVEN: bucket name, expected URL
      const bucketName = 'test bucket';
      const filename = 'test file';
      const expectedUrl = 'https://test%20bucket.storage.googleapis.com/test%20file';
      // GIVEN: Google Storage Service instance
      const storageService = new GoogleStorageService();
      // GIVEN: particular bucket name
      storageService.setBucket('test bucket');

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
      // GIVEN: Google Storage Service Instance
      const storageService = new GoogleStorageService();
      storageService.setGcsOpts({
        bucket: testBucket,
        keyFilename: testFilename,
        projectId: testProject,
      });
      storageService.setFieldName(testFieldName);
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
      storageService.upload(req, mockRes(), (error) => {
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
      // GIVEN: Google Storage Service Instance
      const storageService = new GoogleStorageService();
      storageService.setGcsOpts({
        bucket: testBucket,
        keyFilename: testFilename,
        projectId: testProject,
      });
      storageService.setFieldName(testFieldName);
      storageService.setReadMultipleFiles(true);
      storageService.setFileLimits({ fileSize: 0, maxNumFiles: 2 });
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
      storageService.upload(req, mockRes(), (error) => {
        // THEN: error is null
        expect(error).to.equal(undefined);
        done();
      });
    });
  });
});
