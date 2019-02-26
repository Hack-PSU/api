import { Injectable } from 'injection-js';
import 'reflect-metadata';
import { Logger } from '../../logging/logging';
import { IAcl } from './rbac-types';
import { Role } from './Role';

@Injectable()
export class RBAC implements IAcl {

  private readonly roles: Map<string, Role>;

  constructor() {
    this.roles = new Map<string, Role>();
  }

  public registerRBAC(role: Role) {
    if (this.roles.has(role.name)) {
      this.roles.get(role.name)!.merge(role);
    } else {
      this.roles.set(role.name, role);
    }
  }

  public can(role: string, operation: string, params?: any) {
    if (!this.roles.has(role)) return false;
    const registeredRole: Role = this.roles.get(role)!;
    if (registeredRole.capability.has(operation)) {
      if (registeredRole.action) {
        return registeredRole.action(params);
      }
      return true;
    }
    return registeredRole.inherits ? [...registeredRole.inherits].some(
      inherit => this.can(inherit, operation, params)) : false;
  }

  public printDebugInformation(logger: Logger) {
    logger.info(Array.from(this.roles.values()).join(' | '));
  }
}
