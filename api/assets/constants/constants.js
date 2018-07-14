const fs = require('fs');
const path = require('path');

module.exports = {
  sqlConnection: {
    connectionLimit: 1000,
    timeout: 60 * 60 * 1000,
    connectTimeout: 60 * 60 * 1000,
    acquireTimeout: 60 * 60 * 1000,
    // Required for GCP
    socketPath: `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`,
    // Required for AWS
    host: process.env.SQL_HOSTNAME || process.env.RDS_HOSTNAME || 'localhost',
    user: process.env.SQL_USER || process.env.RDS_USERNAME || 'user',
    password: process.env.SQL_PASSWORD || process.env.RDS_PASSWORD || 'secret',
    database: process.env.SQL_DATABASE || process.env.RDS_DATABASE || 'my_db',
    port: process.env.SQL_PORT || 3306,
    multipleStatements: true,
    prettyError: true,
    caching: true,
    cacheProvider: 'node-cache',
    // cacheProviders can be supplied with additional configurations via this variable!
    cacheProviderSetup: {
      serverLocation: process.env.REDIS_SERVER || '127.0.0.1:11211',
      username: process.env.REDIS_USERNAME || 'username',
      password: process.env.REDIS_PASSWORD || '',
      options: {
        retries: 10,
        retry: 10000,
        remove: true,
      },
    },
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
  },
  firebaseDB: {
    debug: 'https://hackpsu18-debug.firebaseio.com/',
    test: 'https://hackpsu18-test.firebaseio.com/',
    prod: 'https://hackpsu18.firebaseio.com/',
  },
  pushNotifKey: {
    key: process.env.ONESIGNAL_API_KEY || '',
    app_id: process.env.ONESIGNAL_APP_ID || '',
  },
  s3Connection: {
    s3BucketName: process.env.APP_ENV === 'test' ? 'hackpsu-resumes-test' : 'hackpsus2018-resumes',
    s3TravelReimbursementBucket: process.env.APP_ENV === 'test' ? 'hackpsu2018-travel-reimbursement-receipts-test' : 'hackpsus2018-travel-reimbursement-receipts',
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    accessKeyId: process.env.ACCESS_KEY_ID,
    region: 'us-east-2',
  },
  RSVPEmailHtml: {
    fromEmail: 'team@hackpsu.org',
    subject: 'HackPSU RSVP Confirmation',
    text: fs.readFileSync(path.join(__dirname, 'RSVP_Email.html'), 'utf-8'),
  },
  GCS: {
    resumeBucket: process.env.APP_ENV === 'test' ? 'hackpsu-resumes-test' : 'hackpsuf2018-resumes',
    travelReimbursementBucket: process.env.APP_ENV === 'test' ? 'hackpsu2018-travel-reimbursement-receipts-test' : 'hackpsuf2018-travel-reimbursement-receipts',
  },
  SendGridApiKey: process.env.SENDGRID_ACCESS_KEY,
};
