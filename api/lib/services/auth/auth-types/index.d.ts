import { NextFunction, Response } from 'express';
import { IHackpsuRequest } from '../../../JSCommon/hackpsu-request';
import { AclOperations, IAclPerm } from '../RBAC/rbac-types';

export { RBAC } from '../RBAC/rbac';

export interface IAuthService {
  checkAuthentication(token: string): Promise<any>;

  authenticationMiddleware(request: IHackpsuRequest, response: Response, next: NextFunction);

  verifyAcl(permission: IAclPerm, requestedOp: AclOperations): (
    request: IHackpsuRequest,
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
