import * as admin from 'firebase-admin';
import { UidType } from '../../JSCommon/common-types';
import { AuthLevel } from '../../services/auth/auth-types';
import { IDataMapper, IDbResult } from '../../services/database';
import { AdminDataMapperImpl } from './admin-data-mapper-impl';
import { EmailHistory } from './types/email-history';
import UserRecord = admin.auth.UserRecord;

interface IEmail {
  name: string;
  substitutions: Map<string, string>;
  emailId: string;
}

interface IAdminDataMapper extends IDataMapper<any> {
  getEmailFromId(id: UidType): Promise<IDbResult<UserRecord>>;

  sendEmails(
    emails: IEmail[],
    html: string,
    senderUid: UidType,
    subject: string,
    // fromEmail is an optional field. The sendEmails method should provide
    // a default email to send from
    fromEmail?: string,
  ): Promise<{ successfulEmails: EmailHistory[], failedEmails: EmailHistory[] }>;

  addEmailHistory(successfulEmails: EmailHistory[], failedEmails: EmailHistory[]);

  modifyPermissions(
    uid: UidType,
    permissionLevel: AuthLevel,
    privilege: AuthLevel,
  ): Promise<IDbResult<void>>;
}

export { IAdminDataMapper, AdminDataMapperImpl, IEmail };
