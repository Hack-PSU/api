import { Role } from '../Role';

export interface IAcl {
  can(role: string, operation: string, params?: any);

  registerRBAC(role: Role): void;
}

export interface IAclPerm {
  CREATE: string;
  UPDATE: string;
  DELETE: string;
  READ: string;
  READ_ALL: string;
}

export enum AclOperations {
  CREATE,
  UPDATE,
  DELETE,
  READ,
  READ_ALL,
}
