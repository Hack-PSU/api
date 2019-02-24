import { expect } from 'chai';
import 'mocha';
import { RBAC } from '../../../../src/services/auth/RBAC/rbac';
import { Role } from '../../../../src/services/auth/RBAC/Role';

describe('TEST: RBAC Tests', () => {
  describe('TEST: Verify Access Level', () => {
    it('access granted: basic role', () => {
      // GIVEN: RBAC with defined roles
      const rolestring = 'test:role';
      const roles = [
        new Role(
          rolestring,
          ['read'],
        ),
      ];
      // WHEN: verifying access
      const rbac = new RBAC();
      roles.forEach((role) => rbac.registerRBAC(role));
      // THEN: access is granted
      expect(rbac.can(rolestring, 'read'));
    });

    it('access denied: role not present', () => {
      // GIVEN: RBAC with no roles
      const rolestring = 'test:role';
      const roles = [];
      // WHEN: verifying access
      const rbac = new RBAC();
      roles.forEach((role: Role) => rbac.registerRBAC(role));
      // THEN: access is denied
      expect(!rbac.can(rolestring, 'read'));
    });

    it('access denied: action not present', () => {
      // GIVEN: RBAC with defined roles
      const rolestring = 'test:role';
      const roles = [
        new Role(
          rolestring,
          ['read'],
        ),
      ];
      // WHEN: verifying access
      const rbac = new RBAC();
      roles.forEach((role: Role) => rbac.registerRBAC(role));
      // THEN: access is denied
      expect(!rbac.can(rolestring, 'write'));
    });

    it('access granted: inherited role', () => {
      // GIVEN: RBAC with defined roles
      const rolestring = 'test:role';
      const parent_rolestring = 'test:parentrole';
      const roles = [
        new Role(
          rolestring,
          ['read'],
          undefined,
          [parent_rolestring],
        ),
        new Role(
          parent_rolestring,
          ['read', 'write'],
        ),
      ];
      // WHEN: verifying access
      const rbac = new RBAC();
      roles.forEach((role: Role) => rbac.registerRBAC(role));
      // THEN: access is granted
      expect(rbac.can(rolestring, 'write'));
    });

    it('access denied: inherited role', () => {
      // GIVEN: RBAC with defined roles
      const rolestring = 'test:role';
      const parent_rolestring = 'test:parentrole';
      const roles = [
        new Role(
          rolestring,
          ['read'],
          undefined,
          [parent_rolestring],
        ),
        new Role(
          parent_rolestring,
          ['read', 'write'],
        ),
      ];
      // WHEN: verifying access
      const rbac = new RBAC();
      roles.forEach((role: Role) => rbac.registerRBAC(role));
      // THEN: access is granted
      expect(!rbac.can(rolestring, 'delete'));
    });
  });
});
