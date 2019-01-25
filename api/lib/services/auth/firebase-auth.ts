import { validate } from 'email-validator';
import express from 'express';
import * as firebase from 'firebase-admin';
import { Inject, Injectable } from 'injection-js';
import 'reflect-metadata';
import { UidType } from '../../JSCommon/common-types';
import { HttpError } from '../../JSCommon/errors';
import { Environment, Util } from '../../JSCommon/util';
import { IFirebaseService } from '../common/firebase/firebase-types/firebase-service';
import { Logger } from '../logging/logging';
import { AuthLevel, IAuthService } from './auth-types/';
import { AclOperations, IAcl, IAclPerm, IAdminAclPerm } from './RBAC/rbac-types';

@Injectable()
export class FirebaseAuthService implements IAuthService {

  private static extractedPermission(requestedOp: AclOperations, permission: IAclPerm) {
    let requestPermission: string;
    switch (requestedOp) {
      case AclOperations.CREATE:
        requestPermission = permission.CREATE;
        break;
      case AclOperations.UPDATE:
        requestPermission = permission.UPDATE;
        break;
      case AclOperations.DELETE:
        requestPermission = permission.DELETE;
        break;
      case AclOperations.READ:
        requestPermission = permission.READ;
        break;
      case AclOperations.READ_ALL:
        requestPermission = permission.READ_ALL;
        break;
      case AclOperations.COUNT:
        requestPermission = permission.COUNT;
        break;
      case AclOperations.GET_EMAIL:
        // Only supported for IAdminAclPerm
        requestPermission = (permission as IAdminAclPerm).GET_EMAIL;
        break;
      default:
        requestPermission = '';
        break;
    }
    return requestPermission;
  }
  private admin: firebase.auth.Auth;

  constructor(
    @Inject('FirebaseService') private firebaseService: IFirebaseService,
    @Inject('IAcl') private acl: IAcl,
    @Inject('BunyanLogger') private logger: Logger,
  ) {
    this.admin = firebaseService.admin.auth();
  }

  /**
   * Checks if the provided token is authenticated
   * @param token
   * @return {Promise<admin.auth.DecodedIdToken>}
   */
  public checkAuthentication(token: string): Promise<firebase.auth.DecodedIdToken> {
    return this.admin.verifyIdToken(token);
  }

  /**
   * Express.js style middleware function that can be used to authenticate
   * a request with Firebase
   * @param {Request} request The HTTP request object
   * In order to properly verify the request, this function reads the
   * request.headers['idtoken'] field. This should be set properly in the request
   * @param response
   * @param next
   */
  public async authenticationMiddleware(
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) {
    // Allow all requests on local
    if (Util.getCurrentEnv() === Environment.DEBUG) {
      return next();
    }
    if (!request.headers.idtoken) {
      return Util.standardErrorHandler(new HttpError('ID token must be provided', 401), next);
    }
    try {
      const decodedToken = await this.checkAuthentication(request.headers.idtoken as string);
      response.locals.user = decodedToken;
      response.locals.privilege = decodedToken.privilege;
      next();
    } catch (e) {
      this.logger.info(e);
      return Util.standardErrorHandler(new HttpError(e.message || e, 401), next);
    }
  }

  /**
   * Verifies if the given user has the ability to access the requested operation
   * NOTE: This function requires that response.locals.user is set.
   * @param {IAclPerm} permission The operation permission for the object e.g. event:create
   * @param {AclOperations} requestedOp The requested operation to perform
   * @returns {(request: Request, response: e.Response, next: e.NextFunction) => void}
   */
  public verifyAcl(permission: IAclPerm, requestedOp: AclOperations | AclOperations[]) {
    return (request: express.Request, response: express.Response, next: express.NextFunction) => {
      // Remove if you require idtoken support locally
      if (Util.getCurrentEnv() === Environment.DEBUG) {
        return next();
      }

      /**
       * The user is an {@link AuthLevel.PARTICIPANT} which is the default AuthLevel
       */
      if (!response.locals.user.privilege) {
        response.locals.user.privilege = AuthLevel.PARTICIPANT;
      }
      let requestPermission;
      if (Array.isArray(requestedOp)) {
        const result = (requestedOp as AclOperations[]).every((op) => {
          requestPermission = FirebaseAuthService.extractedPermission(op, permission);
          return this.aclVerifier(
            response.locals.user.privilege,
            requestPermission,
            response.locals.customVerifierParams,
          );
        });
        if (!result) {
          const error = new HttpError('Insufficient permissions for this operation', 401);
          return Util.standardErrorHandler(error, next);
        }
        return next();
      }
      requestPermission = FirebaseAuthService.extractedPermission(requestedOp, permission);
      if (!this.aclVerifier(
        response.locals.user.privilege,
        requestPermission,
        response.locals.customVerifierParams,
      )) {
        const error = new HttpError('Insufficient permissions for this operation', 401);
        return Util.standardErrorHandler(error, next);
      }
      return next();
    };
  }

  public getUserId(identifier: UidType | string) {
    if (validate(identifier)) {
      return this.admin.getUserByEmail(identifier);
    }
    return this.admin.getUser(identifier);
  }

  /**
   * Returns whether the ACL found is allowed to access the operation of the requested
   * level
   */
  public aclVerifier(
    foundAcl: AuthLevel | AuthLevel[],
    requestedOp: string,
    customParams?: any,
  ): boolean {
    if (Array.isArray(foundAcl)) {
      return (foundAcl as AuthLevel[]).some(
        acl => this.acl.can(AuthLevel[acl], requestedOp, customParams));
    }
    return this.acl.can(AuthLevel[foundAcl], requestedOp, customParams);
  }

  public elevate(uid: UidType, privilege: AuthLevel) {
    return this.admin.setCustomUserClaims(uid, { privilege, admin: true });
  }
}

//
// /**
//  * Makes the provided UID an administrator with the provided privilege level
//  * @param uid
//  * @param privilege
//  * @return {Promise<void>}
//  */

//
// /**
//  * Retrieve the userID base on the email provided
//  *  @param email
//  *  @return Promise{firebase.auth.UserRecord}
//  */
// export function getUserId(email) {
//   return admin.auth().getUserByEmail(email);
// }
//
// /**
//  *
//  * @param uid
//  * @return {Promise<firebase.auth.UserRecord>}
//  */
// export function getUserData(uid) {
//   return admin.auth().getUser(uid);
// }

// /**
//  * This function checks if the current user has the permissions required to access the function
//  * Precondition: Must have called verifyAuthMiddleware or similar function that
//  *              stores the auth object in res.locals
//  * @param {Number} level The level of access [1,4] that the function needs
//  * @return {Function}
//  */
// export function verifyACL(level) {
//   // TODO: Add support for an ACL matrix instead. Use Redis perhaps?
//   return (req, res, next) => {
//     if (process.env.NODE_ENV === 'debug') {
//       // Remove if you require idtoken support locally
//       return next();
//     }
//     if (!res.locals.user.privilege) {
//       const error = new HttpError('insufficient permissions for this operation', 401);
//       return next(error);
//     }
//     if (res.locals.user.privilege < level) {
//       const error = new HttpError('insufficient permissions for this operation', 401);
//       return next(error);
//     }
//     return next();
//   };
// }
