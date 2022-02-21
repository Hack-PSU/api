import { Logger } from '../../../logging/logging';
import { Role } from '../Role';

/**
 * This interface provides role based access control.
 * Roles and their actions can be registered with the ACL
 * implementation. Queries for access are answered based on
 * the role of the principal and the operation in question
 */
export interface IAcl {
  can(role: string, operation: string, params?: any): boolean;

  /**
   * This method registers a {@link Role} with the ACL system
   * This method should be idempotent
   */
  registerRBAC(role: Role): void;

  /**
   * Print the current state of the ACL system to the provided logger
   */
  printDebugInformation(logger: Logger): void;
}

/**
 * Any implementing class must provide string definitions
 * for the following general permissions. These definitions
 * are used by an {@link IAcl} implementation to run access
 * control verification
 */
export interface IAclPerm {
  CREATE: string;
  UPDATE: string;
  DELETE: string;
  READ: string;
  READ_ALL: string;
  COUNT: string;
}

export interface IExtraCreditAclPerm extends IAclPerm {
  READ_ALL_CLASSES: string;
  READ_BY_UID: string;
  READ_BY_CLASS: string;
}

/**
 * This interface is an extension of IAclPerm that provides
 * string definitions for more specific administrator actions
 */
export interface IAdminAclPerm extends IAclPerm {
  GET_EMAIL: string;
  SEND_EMAIL: string;
  REDUCE_PERMISSION: string;
  MAKE_ACTIVE: string;
}

export interface IWorkshopAclPerm extends IAclPerm {
  CHECK_IN: string;
}

/**
 * This enum is used as a mapping from operations to
 * An IAcl's member IAclPerm implementation. In order to
 * keep functioning error free, ensure that the enumerable
 * names here match those in IAclPerm and its extensions
 */
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
  MAKE_ACTIVE,
  READ_ALL_CLASSES,
  READ_BY_UID,
  READ_BY_CLASS,
  CHECK_IN,
}
