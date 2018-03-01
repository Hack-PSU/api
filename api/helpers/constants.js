module.exports = {
    emailObjectSchema: {
        type: 'object',
        properties: {
            email: {
                type: 'string',
                format: 'email',
            },
            name: {
                type: 'string',
                minLength: 1,
            },
            substitutions: {
                type: 'object',
                additionalProperties: {type: 'string'},
            },
        },
        required: ['email', 'name'],
    },
    sqlConnection: {
        host     : process.env.RDS_HOSTNAME || 'localhost',
        user     : process.env.RDS_USERNAME || 'user',
        password : process.env.RDS_PASSWORD || 'secret',
        database : process.env.RDS_DATABASE || 'my_db',
    },
    emailKey: {
        key: process.env.AWS_ACCESS_KEY_ID,
        secret: process.env.AWS_SECRET_ACCESS_KEY
    }
};
