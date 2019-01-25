import { Logger } from '../../../logging/logging';
import { Role } from '../Role';

export interface IAcl {
  can(role: string, operation: string, params?: any);

  registerRBAC(role: Role): void;

  printDebugInformation(logger: Logger): void;
}

export interface IAclPerm {
  CREATE: string;
  UPDATE: string;
  DELETE: string;
  READ: string;
  READ_ALL: string;
  COUNT: string;
}

export interface IAdminAclPerm extends IAclPerm {
  GET_EMAIL: string;
  SEND_EMAIL: string;
  REDUCE_PERMISSION: string;
}

export interface IAdminStatisticsPerm extends IAclPerm {
  STATISTICS: string;
}

export enum AclOperations {
  SEND_EMAIL,
  COUNT,
  CREATE,
  UPDATE,
  DELETE,
  READ,
  READ_ALL,
  GET_EMAIL,
  REDUCE_PERMISSION,
  STATISTICS,
}
