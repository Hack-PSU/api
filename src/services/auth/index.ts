import { AuthLevel } from './auth-types';
import { FirebaseAuthService } from './firebase-auth';

interface ICustomPermissions {
  admin: boolean;
  privilege: AuthLevel;
}

export { ICustomPermissions, FirebaseAuthService };
