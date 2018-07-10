const Chance = require('chance');

const chance = new Chance();
const admin = require('firebase-admin');
const squel = require('squel');
const uuidv4 = require('uuid/v4');
const sql = require('mysql');
const sqlOptions = require('../assets/helpers/constants').sqlConnection;

const connection = sql.createConnection(sqlOptions);
connection.connect((err) => {
  if (err) {
    console.error(err.stack);
  }
});


function generateGoodRegistration() {
  return {
    firstName: chance.first(),
    lastName: chance.last(),
    email: chance.email(),
    gender: chance.gender().toLowerCase(),
    shirt_size: 'M',
    dietary_restriction: 'vegetarian',
    university: 'Georgetown University',
    travel_reimbursement: false,
    first_hackathon: true,
    academic_year: 'freshman',
    major: 'Visual aesthetics',
    phone: chance.phone(),
    race: 'caucasian',
    coding_experience: 'beginner',
    eighteenBeforeEvent: true,
    mlh_coc: true,
    mlh_dcp: true,
    uid: uuidv4().replace('-', ''),
    referral: 'Facebook',
    project: chance.sentence(),
    expectations: chance.sentence(),
    veteran: true,
    hackathon: '84ed52ff52f84591aabe151666fae240',
  };
}

async function doStuff() {
  for (let i = 0; i < 40; i++) {
    const reg = generateGoodRegistration();
    const query = squel.insert({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .into('REGISTRATION_TEST')
      .setFieldsRows([
        reg,
      ]).toParam();
    query.text = query.text.concat(';');
    try {
      await new Promise((resolve, reject) => {
        connection.query(query.text, query.values, (err, result) => {
          if (err && err.errno === 1062) {
            const error = new Error();
            error.message = 'User already registered';
            error.status = 400;
            reject(error);
          } else if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
    } catch (e) {
      console.error(e);
    }
  }
}

doStuff();
