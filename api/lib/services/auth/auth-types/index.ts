import { NextFunction, Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { UidType } from '../../../JSCommon/common-types';
import { AclOperations, IAclPerm } from '../RBAC/rbac-types';

export { RBAC } from '../RBAC/rbac';

export interface IAuthService {
  checkAuthentication(token: string): Promise<any>;

  authenticationMiddleware(request: Request, response: Response, next: NextFunction);

  verifyAcl(permission: IAclPerm, requestedOp: AclOperations | AclOperations[]): (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => void;

  getUserId(identifier: UidType | string): Promise<admin.auth.UserRecord>;

  /**
   * Returns whether the ACL found is allowed to access the operation of the requested
   * level
   */
  aclVerifier(
    foundAcl: AuthLevel | AuthLevel[],
    requestedOp: string,
    customParams?: any,
  ): boolean;

  elevate(uid, privilege): Promise<void>;
}

export enum AuthLevel {
  PARTICIPANT,
  VOLUNTEER,
  TEAM_MEMBER,
  DIRECTOR,
  TECHNOLOGY,
  FINANCE,
}
