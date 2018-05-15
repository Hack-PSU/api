module.exports = {
  emailKey: {
    key: process.env.ACCESS_KEY_ID,
    secret: process.env.SECRET_ACCESS_KEY,
  },
  rediskey: process.env.REDIS_API_KEY || 'rediskey',
  sqlConnection: {
    connectionLimit: 100,
    host: process.env.RDS_HOSTNAME || 'localhost',
    user: process.env.RDS_USERNAME || 'user',
    password: process.env.RDS_PASSWORD || 'secret',
    database: process.env.RDS_DATABASE || 'my_db',
    multipleStatements: true,
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
  pushNotifKey: {
    key: process.env.ONESIGNAL_API_KEY || '',
    app_id: process.env.ONESIGNAL_APP_ID || '',
  },
  s3Connection: {
    s3BucketName: 'hackpsus2018-resumes',
    s3TravelReimbursementBucket: 'hackpsus2018-travel-reimbursement-receipts',
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    accessKeyId: process.env.ACCESS_KEY_ID,
    region: 'us-east-2',
  },
};