"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const util_1 = require("../../JSCommon/util");
class Constants {
}
Constants.HACKATHON_NAME = 'hackpsuS2019';
Constants.sqlConnection = {
    acquireTimeout: 60 * 60 * 1000,
    connectTimeout: 60 * 60 * 1000,
    connectionLimit: 1000,
    database: util_1.Util.readEnv('SQL_DATABASE', 'my_db') || util_1.Util.readEnv('RDS_DATABASE', 'my_db'),
    // Required for AWS
    host: util_1.Util.readEnv('SQL_HOSTNAME', 'localhost') || util_1.Util.readEnv('RDS_HOSTNAME', 'localhost'),
    multipleStatements: true,
    // Required for GCP
    password: util_1.Util.readEnv('SQL_PASSWORD', 'secret') || util_1.Util.readEnv('RDS_PASSWORD', 'secret'),
    port: util_1.Util.readEnv('SQL_PORT', '3306'),
    socketPath: `/cloudsql/${util_1.Util.readEnv('INSTANCE_CONNECTION_NAME', '')}`,
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
    user: util_1.Util.readEnv('SQL_USER', 'user') || util_1.Util.readEnv('RDS_USERNAME', 'user'),
};
Constants.firebaseDB = {
    debug: 'https://hackpsu18-debug.firebaseio.com/',
    prod: 'https://hackpsu18.firebaseio.com/',
    test: 'https://hackpsu18-staging.firebaseio.com/',
};
Constants.pushNotifKey = {
    app_id: util_1.Util.readEnv('ONESIGNAL_APP_ID', ''),
    key: util_1.Util.readEnv('ONESIGNAL_API_KEY', ''),
};
Constants.s3Connection = {
    accessKeyId: util_1.Util.readEnv('ACCESS_KEY_ID', ''),
    region: 'us-east-2',
    s3BucketName: 'hackpsu-resumes',
    s3TravelReimbursementBucket: 'hackpsu2018-travel-reimbursement-receipts',
    secretAccessKey: util_1.Util.readEnv('SECRET_ACCESS_KEY', ''),
};
Constants.RSVPEmailHtml = {
    fromEmail: 'team@hackpsu.org',
    subject: 'HackPSU RSVP Confirmation',
    text: fs.readFileSync(path.join(__dirname, 'RSVP_Email.html'), 'utf-8'),
};
Constants.GCS = {
    resumeBucket: 'hackpsu-resumes',
    travelReimbursementBucket: 'hackpsu2018-travel-reimbursement-receipts',
};
Constants.SendGridApiKey = util_1.Util.readEnv('SENDGRID_ACCESS_KEY', '');
Constants.MailchimpApiKey = util_1.Util.readEnv('MAILCHIMP_API_KEY', '');
Constants.MailchimpPreregEmailList = 'HackPSU Email List';
Constants.redisKey = util_1.Util.readEnv('REDIS_KEY', '');
exports.Constants = Constants;
//# sourceMappingURL=constants.prod.js.map