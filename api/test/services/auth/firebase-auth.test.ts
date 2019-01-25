import { Arg, Substitute } from '@fluffy-spoon/substitute';
import { expect } from 'chai';
import * as firebase from 'firebase-admin';
import 'mocha';
import { mockReq, mockRes } from 'sinon-express-mock';
import { AuthLevel } from '../../../lib/services/auth/auth-types';
import { FirebaseAuthService } from '../../../lib/services/auth/firebase-auth';
import { RBAC } from '../../../lib/services/auth/RBAC/rbac';
import { AclOperations, IAcl } from '../../../lib/services/auth/RBAC/rbac-types';
import { Role } from '../../../lib/services/auth/RBAC/Role';
import { IFirebaseService } from '../../../lib/services/common/firebase/firebase-types/firebase-service';
import { Logger } from '../../../lib/services/logging/logging';

// Mocked services
let firebaseService: IFirebaseService;
let privilege: any;
let testDecodedToken: any;
let mockedAuth;

describe('TEST: Firebase Auth Test', () => {
  beforeEach(() => {
    // Configure mock authentication service

    testDecodedToken = { privilege, uid: 'test uid' };
    const mockedApp = Substitute.for<firebase.app.App>();
    mockedAuth = Substitute.for<firebase.auth.Auth>();
    mockedApp.auth().returns(mockedAuth);
    firebaseService = {
      admin: mockedApp,
    };
  });

  describe('TEST: Check Authentication', () => {
    it('authentication verified', (done) => {
      // GIVEN: authentication result should be true
      mockedAuth.verifyIdToken(Arg.any())
      // @ts-ignore
        .returns(Promise.resolve(testDecodedToken));
      // GIVEN: given a firebase authentication service
      const firebaseAuthService = new FirebaseAuthService(firebaseService, Substitute.for<IAcl>(), new Logger());

      // WHEN: Checking authentication
      const result = firebaseAuthService.checkAuthentication('test token');

      // THEN: it responds with a decoded token
      result.then((token) => {
        expect(token).equals(testDecodedToken);
        done();
      }).catch(error => done(error));
    });

    it('authentication failure', (done) => {
      // GIVEN: authentication result should be false;
      mockedAuth.verifyIdToken(Arg.any())
        .returns(
          // @ts-ignore
          Promise.reject(new Error('authentication failed')),
        );
      // GIVEN: a firebase authentication service
      const firebaseAuthService = new FirebaseAuthService(firebaseService, Substitute.for<IAcl>(), new Logger());

      // WHEN: Checking authentication
      const result = firebaseAuthService.checkAuthentication('test token');
      // THEN: it throws an error
      result
        .then(token => done(token))
        .catch((error) => {
          expect(error).to.not.equal(null);
          done();
        });
    });
  });

  describe('TEST: Check privilege', () => {
    describe('RESULT: access granted', () => {
      it('to person with privilege', (done) => {
        // GIVEN: User token with given role
        privilege = 5;
        // GIVEN: a firebase authentication service and RBAC service
        const rbac = new RBAC();
        rbac.registerRBAC(new Role(AuthLevel[privilege], ['test:access']));
        const firebaseAuthService = new FirebaseAuthService(firebaseService, rbac, new Logger());
        // GIVEN: environment is set to production
        process.env.APP_ENV = 'PROD';

        // WHEN: Checking permission
        const middleware = firebaseAuthService.verifyAcl(
          { CREATE: 'test:access', READ: '', DELETE: '', UPDATE: '', READ_ALL: '' },
          AclOperations.CREATE,
        );
        // THEN: Allows access
        const mockedResponse = mockRes({ locals: { user: { privilege } } });
        middleware(mockReq(), mockedResponse, done);
      });

      it('to person without privilege on operation requiring none', (done) => {
        // GIVEN: User token with given role
        privilege = 0;
        // GIVEN: a firebase authentication service and RBAC service
        const rbac = new RBAC();
        rbac.registerRBAC(new Role(AuthLevel[privilege], ['test:access']));
        const firebaseAuthService = new FirebaseAuthService(firebaseService, rbac, new Logger());
        // GIVEN: environment is set to production
        process.env.APP_ENV = 'PROD';

        // WHEN: Checking permission
        const middleware = firebaseAuthService.verifyAcl(
          { READ_ALL: '', CREATE: '', READ: 'test:access', DELETE: '', UPDATE: '' },
          AclOperations.READ,
        );
        // THEN: Allows access
        const mockedResponse = mockRes({ locals: { user: {} } });
        middleware(mockReq(), mockedResponse, done);
      });

      it('to person with more than one privileges', (done) => {
        // GIVEN: User token with given role
        privilege = [5, 3];
        const mockedResponse = mockRes({ locals: { user: { privilege } } });
        // GIVEN: a firebase authentication service and RBAC service
        const rbac = new RBAC();
        rbac.registerRBAC(new Role(AuthLevel[privilege[0]], ['test:access']));
        rbac.registerRBAC(new Role(AuthLevel[privilege[1]], ['test:update']));
        const firebaseAuthService = new FirebaseAuthService(firebaseService, rbac, new Logger());
        // GIVEN: environment is set to production
        process.env.APP_ENV = 'PROD';

        // WHEN: Checking permission
        let middleware = firebaseAuthService.verifyAcl({
          READ_ALL: '',
          CREATE: '',
          READ: '',
          DELETE: 'test:access',
          UPDATE: 'test:update',
        }, AclOperations.DELETE);
        // THEN: Allows access
        middleware(mockReq(), mockedResponse, (response) => {
          if (response) {
            done(response);
          }
        });

        // WHEN: Checking permission
        middleware = firebaseAuthService.verifyAcl({
          READ_ALL: '',
          CREATE: 'test:access',
          READ: '',
          DELETE: '',
          UPDATE: 'test:update',
        }, AclOperations.UPDATE);
        // THEN: Allows access
        middleware(mockReq(), mockedResponse, done);
      });

      it('to person with privilege with custom defined action', (done) => {
        // GIVEN: User token with given role
        privilege = 5;
        const mockedResponse = mockRes({ locals: { user: { privilege } } });
        // GIVEN: a firebase authentication service and RBAC service with custom action
        let actionResult = true;
        const rbac = new RBAC();
        rbac.registerRBAC(new Role(AuthLevel[privilege], ['test:access'], () => actionResult));
        const firebaseAuthService = new FirebaseAuthService(firebaseService, rbac, new Logger());
        // GIVEN: environment is set to production
        process.env.APP_ENV = 'PROD';

        // WHEN: Checking permission
        let middleware = firebaseAuthService.verifyAcl({
          READ_ALL: '',
          CREATE: '',
          READ: '',
          DELETE: 'test:access',
          UPDATE: 'test:update',
        }, AclOperations.DELETE);
        // THEN: Allows access
        middleware(mockReq(), mockedResponse, (response) => {
          if (response) {
            done(response);
          }
        });

        // GIVEN: custom action result is false
        actionResult = false;
        // WHEN: Checking permission
        middleware = firebaseAuthService.verifyAcl({
          READ_ALL: '',
          CREATE: 'test:access',
          READ: '',
          DELETE: '',
          UPDATE: 'test:update',
        }, AclOperations.UPDATE);
        // THEN: Allows access
        middleware(mockReq(), mockedResponse, (response) => {
          if (!response) {
            done('Incorrent result');
          }
          done();
        });
      });
    });

    describe('RESULT: access denied', () => {
      it('to person with privilege and wrong operation permission', (done) => {
        // GIVEN: User token with given role
        privilege = 5;
        // GIVEN: a firebase authentication service and RBAC service
        const rbac = new RBAC();
        rbac.registerRBAC(new Role(AuthLevel[privilege], ['test:access']));
        const firebaseAuthService = new FirebaseAuthService(firebaseService, rbac, new Logger());
        // GIVEN: environment is set to production
        process.env.APP_ENV = 'PROD';

        // WHEN: Checking permission
        const middleware = firebaseAuthService.verifyAcl(
          { READ_ALL: '', CREATE: 'test:noaccess', READ: '', DELETE: '', UPDATE: '' },
          AclOperations.CREATE,
        );
        // THEN: Blocks access
        const mockedResponse = mockRes({ locals: { user: { privilege } } });
        middleware(mockReq(), mockedResponse, (response) => {
          expect(response.body)
            .to
            .deep
            .equal({ message: 'Insufficient permissions for this operation' });
          done();
        });
      });

      it('to person with privilege and illegal operation request', (done) => {
        // GIVEN: User token with given role
        privilege = 5;
        const mockedResponse = mockRes({ locals: { user: { privilege } } });
        // GIVEN: a firebase authentication service and RBAC service
        const rbac = new RBAC();
        rbac.registerRBAC(new Role(AuthLevel[privilege], ['test:access']));
        const firebaseAuthService = new FirebaseAuthService(firebaseService, rbac, new Logger());
        // GIVEN: environment is set to production
        process.env.APP_ENV = 'PROD';

        // WHEN: Checking permission
        const middleware = firebaseAuthService.verifyAcl(
          { READ_ALL: '', CREATE: 'test:access', READ: '', DELETE: '', UPDATE: '' },
          8,
        );
        // THEN: Blocks access
        middleware(mockReq(), mockedResponse, (response) => {
          expect(response.body)
            .to
            .deep
            .equal({ message: 'Insufficient permissions for this operation' });
          done();
        });
      });

      it('to person with privilege and different operation request', (done) => {
        // GIVEN: User token with given role
        privilege = 5;
        const mockedResponse = mockRes({ locals: { user: { privilege } } });
        // GIVEN: a firebase authentication service and RBAC service
        const rbac = new RBAC();
        rbac.registerRBAC(new Role(AuthLevel[privilege], ['test:access']));
        const firebaseAuthService = new FirebaseAuthService(firebaseService, rbac, new Logger());
        // GIVEN: environment is set to production
        process.env.APP_ENV = 'PROD';

        // WHEN: Checking permission
        const middleware = firebaseAuthService.verifyAcl(
          { READ_ALL: '', CREATE: 'test:access', READ: '', DELETE: '', UPDATE: '' },
          AclOperations.READ,
        );
        // THEN: Blocks access
        middleware(mockReq(), mockedResponse, (response) => {
          expect(response.body)
            .to
            .deep
            .equal({ message: 'Insufficient permissions for this operation' });
          done();
        });
      });

      it('to person without privilege', (done) => {
        // GIVEN: User token with given role
        privilege = 4;
        const mockedResponse = mockRes({ locals: { user: {} } });
        // GIVEN: a firebase authentication service and RBAC service
        const rbac = new RBAC();
        rbac.registerRBAC(new Role(AuthLevel[privilege], ['test:access']));
        rbac.registerRBAC(new Role(AuthLevel[privilege], ['test:access2']));
        const firebaseAuthService = new FirebaseAuthService(firebaseService, rbac, new Logger());
        // GIVEN: environment is set to production
        process.env.APP_ENV = 'PROD';

        // WHEN: Checking permission
        const middleware = firebaseAuthService.verifyAcl(
          { READ_ALL: '', CREATE: 'test:access2', READ: '', DELETE: '', UPDATE: '' },
          AclOperations.CREATE,
        );
        // THEN: Blocks access
        middleware(mockReq(), mockedResponse, (response) => {
          expect(response.body)
            .to
            .deep
            .equal({ message: 'Insufficient permissions for this operation' });
          done();
        });
      });
    });
  });
});
