import { expect } from 'chai';
import 'mocha';
import { RBAC } from '../../../../lib/services/auth/RBAC/rbac';

describe('TEST: RBAC', () => {
  describe('TEST: Verify Access Level', () => {
    it('access granted: basic role', () => {
      // GIVEN: RBAC with defined roles
      const rolestring = 'test:role';
      const roles = [
        {
          action: undefined,
          capability: new Set<string>(['read']),
          inherits: undefined,
          name: rolestring,
        },
      ];
      // WHEN: verifying access
      const rbac = new RBAC(roles);
      // THEN: access is granted
      expect(rbac.can(rolestring, 'read'));
    });

    it('access denied: role not present', () => {
      // GIVEN: RBAC with no roles
      const rolestring = 'test:role';
      const roles = [];
      // WHEN: verifying access
      const rbac = new RBAC(roles);
      // THEN: access is denied
      expect(!rbac.can(rolestring, 'read'));
    });

    it('access denied: action not present', () => {
      // GIVEN: RBAC with defined roles
      const rolestring = 'test:role';
      const roles = [
        {
          action: undefined,
          capability: new Set<string>(['read']),
          inherits: undefined,
          name: rolestring,
        },
      ];
      // WHEN: verifying access
      const rbac = new RBAC(roles);
      // THEN: access is denied
      expect(!rbac.can(rolestring, 'write'));
    });

    it('access granted: inherited role', () => {
      // GIVEN: RBAC with defined roles
      const rolestring = 'test:role';
      const parent_rolestring = 'test:parentrole';
      const roles = [
        {
          action: undefined,
          capability: new Set<string>(['read']),
          inherits: new Set<string>([parent_rolestring]),
          name: rolestring,
        },
        {
          action: undefined,
          capability: new Set<string>(['read', 'write']),
          inherits: undefined,
          name: parent_rolestring,
        },
      ];
      // WHEN: verifying access
      const rbac = new RBAC(roles);
      // THEN: access is granted
      expect(rbac.can(rolestring, 'write'));
    });

    it('access denied: inherited role', () => {
      // GIVEN: RBAC with defined roles
      const rolestring = 'test:role';
      const parent_rolestring = 'test:parentrole';
      const roles = [
        {
          action: undefined,
          capability: new Set<string>(['read']),
          inherits: new Set<string>([parent_rolestring]),
          name: rolestring,
        },
        {
          action: undefined,
          capability: new Set<string>(['read', 'write']),
          inherits: undefined,
          name: parent_rolestring,
        },
      ];
      // WHEN: verifying access
      const rbac = new RBAC(roles);
      // THEN: access is granted
      expect(!rbac.can(rolestring, 'delete'));
    });
  });
});
