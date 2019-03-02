import * as fs from 'fs';
import * as path from 'path';
import { Util } from '../../JSCommon/util';

export class Constants {
  public static readonly HACKATHON_NAME = 'hackpsuS2019';
  public static readonly sqlConnection = {
    acquireTimeout: 60 * 60 * 1000,
    connectTimeout: 60 * 60 * 1000,
    connectionLimit: 1000,
    database: Util.readEnv('SQL_DATABASE', 'my_db') || Util.readEnv('RDS_DATABASE', 'my_db'),
    // Required for AWS
    host: Util.readEnv('SQL_HOSTNAME', 'localhost') || Util.readEnv('RDS_HOSTNAME', 'localhost'),
    multipleStatements: true,
    // Required for GCP
    password: Util.readEnv('SQL_PASSWORD', 'secret') || Util.readEnv('RDS_PASSWORD', 'secret'),
    port: Util.readEnv('SQL_PORT', '3306'),
    socketPath: `/cloudsql/${Util.readEnv('INSTANCE_CONNECTION_NAME', '')}`,
    timeout: 60 * 60 * 1000,
    typeCast: function castField(field, useDefaultTypeCasting) {
      // We only want to cast bit fields that have a single-bit in them. If the field
      // has more than one bit, then we cannot assume it is supposed to be a Boolean.
      if ((field.type === 'BIT') && (field.length === 1)) {
        const bytes = field.buffer();

        // A Buffer in Node represents a collection of 8-bit unsigned integers.
        // Therefore, our single "bit field" comes back as the bits '0000 0001',
        // which is equivalent to the number 1.
        return (bytes[0] === 1);
      }
      return (useDefaultTypeCasting());
    },
    user: Util.readEnv('SQL_USER', 'user') || Util.readEnv('RDS_USERNAME', 'user'),
  };

  public static readonly firebaseDB = {
    debug: 'https://hackpsu18-debug.firebaseio.com/',
    prod: 'https://hackpsu18.firebaseio.com/',
    test: 'https://hackpsu18-staging.firebaseio.com/',
  };

  public static readonly pushNotifKey = {
    app_id: Util.readEnv('ONESIGNAL_APP_ID', ''),
    key: Util.readEnv('ONESIGNAL_API_KEY', ''),
  };
  public static readonly s3Connection = {
    accessKeyId: Util.readEnv('ACCESS_KEY_ID', ''),
    region: 'us-east-2',
    s3BucketName: 'hackpsu-resumes',
    s3TravelReimbursementBucket: 'hackpsu2018-travel-reimbursement-receipts',
    secretAccessKey: Util.readEnv('SECRET_ACCESS_KEY', ''),
  };

  public static readonly RSVPEmailHtml = {
    fromEmail: 'team@hackpsu.org',
    subject: 'HackPSU RSVP Confirmation',
    text: fs.readFileSync(path.join(__dirname, 'RSVP_Email.html'), 'utf-8'),
  };

  public static readonly GCS = {
    resumeBucket: 'hackpsu-resumes',
    travelReimbursementBucket: 'hackpsu2018-travel-reimbursement-receipts',
  };
  public static readonly SendGridApiKey = Util.readEnv('SENDGRID_ACCESS_KEY', '');
  public static readonly MailchimpApiKey = Util.readEnv('MAILCHIMP_API_KEY', '');
  public static readonly MailchimpPreregEmailList = 'HackPSU Email List';
  public static readonly redisKey = Util.readEnv('REDIS_KEY', '');
}
