var readline = require('readline');
var log = console.log;

var sqlConnection= {
    host: process.env.RDS_HOSTNAME || 'localhost',
    user: process.env.RDS_USERNAME || 'user',
    password: process.env.RDS_PASSWORD || 'secret',
    database: process.env.RDS_DATABASE || 'my_db',
    multipleStatements: true,
    // ssl: "Amazon RDS",
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
  }

const sql = require('mysql');
const connection = sql.createConnection(sqlConnection);

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var recursiveAsyncReadLine = function () {
  rl.question('Email: ', function (answer) {
    if (answer == 'exit') //we need some base case, for recursion
      return rl.close(); //closing RL and returning from function.
    log('Got it! Your answer was: "', answer, '"');
      rl.question('Class: ', async (className) => {
          try {
          var result = await assignEC(answer, className);
              console.log(result);
          } catch(error) {
              console.error(error);
          }
          recursiveAsyncReadLine(); //Calling this function again to ask new question
      });
  });
};

recursiveAsyncReadLine(); //we have to actually start our recursion somehow

function assignEC(email, className) {
    return new Promise((resolve, reject) => {
        var query = 'INSERT INTO `EXTRA_CREDIT_ASSIGNMENT`(`user_uid`, `class_uid`) VALUES ((SELECT `uid` from `REGISTRATION` WHERE `email` = ?),(SELECT `uid` from `EXTRA_CREDIT_CLASSES` WHERE `class_name` = ?))';
        var params = [email, className];
        console.log(query);
        console.log(params);
        connection.query(query, params, (err, response) => {
            if (err) reject (err);
            else resolve(response);
        });
    });
}
