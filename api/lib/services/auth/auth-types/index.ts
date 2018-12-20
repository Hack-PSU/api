import { NextFunction, Request, Response } from 'express';
import { AclOperations, IAclPerm } from '../RBAC/rbac-types';

export { RBAC } from '../RBAC/rbac';

export interface IAuthService {
  checkAuthentication(token: string): Promise<any>;

  authenticationMiddleware(request: Request, response: Response, next: NextFunction);

  verifyAcl(permission: IAclPerm, requestedOp: AclOperations): (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => void;
}

export enum AuthLevel {
  PARTICIPANT,
  VOLUNTEER,
  TEAM_MEMBER,
  DIRECTOR,
  TECHNOLOGY,
  FINANCE,
}
