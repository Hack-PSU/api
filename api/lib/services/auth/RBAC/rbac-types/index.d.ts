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
}

export enum AclOperations {
  CREATE,
  UPDATE,
  DELETE,
  READ,
}
