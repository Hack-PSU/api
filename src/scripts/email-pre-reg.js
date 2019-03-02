const mysql = require('mysql');
const nodecipher = require('node-cipher');
const fs = require('fs');

const admin = require('firebase-admin');
const uuid = require('uuid/v4');
const request = require('request');
const firebase = require('firebase');

const fbconfig = {
  apiKey: 'AIzaSyCpvAPdiIcqKV_NTyt6DZgDUNyjmA6kwzU',
  authDomain: 'hackpsu18.firebaseapp.com',
  databaseURL: 'https://hackpsu18.firebaseio.com',
  projectId: 'hackpsu18',
  storageBucket: 'hackpsu18.appspot.com',
  messagingSenderId: '1002677206617',
};
firebase.initializeApp(fbconfig);

const emailHtml = fs.readFileSync('reg_open_email_template.html', 'utf-8');

nodecipher.decrypt({
  input: 'config.json.aes',
  output: 'config.json',
  password: process.env.decryptPass,
  algorithm: 'aes-256-cbc-hmac-sha256',
}, (err, opts) => {
  if (err) throw err;

  console.log('It worked!');
  const config = require('../config.json');

  const connection = mysql.createConnection({
    host: config.RDS_HOSTNAME,
    user: config.RDS_USERNAME,
    password: config.RDS_PASSWORD,
    port: config.RDS_PORT,
    database: 'ebdb',
  });

  connection.connect((err) => {
    if (err) {
      console.error(`Database connection failed: ${err.stack}`);
      return;
    }
    console.log('Connected to database.');
    connection.query('SELECT * FROM PRE_REGISTRATION', (err, response) => {
      if (err) throw err;
      const emails = response.map(r => ({ email: r.email }));
      console.log(emails);
      sendEmail(emails)
        .catch(err => console.error(err));
    });
  });
});


/**
 *
 * @param email
 * @param name
 * @return {Promise<any>}
 */
function sendEmail(email) {
  const emails = fs.readFileSync('pre_reg_emails.txt', 'utf-8');
  return new Promise((resolve, reject) => {
    if (emails.indexOf(email) !== -1) {
      resolve();
    } else {
      firebase.auth().signInWithEmailAndPassword('firebase@email.com', 'password')
        .then((user) => {
          user.getIdToken(true)
            .then((idtoken) => {
              const options = {
                uri: 'https://api.hackpsu.org/v1/firebase/email',
                method: 'POST',
                headers: {
                  idtoken,
                },
                json: {
                  emails: email,
                  subject: 'HackPSU registration is now open!',
                  html: emailHtml,
                },
              };
              console.log(options);
              request(options, (err, res, body) => {
                if (err) {
                  console.error(err);
                  reject(err);
                } else {
                  fs.writeFileSync('pre_reg_emails.txt', `${emails + email}\n`, { encoding: 'utf-8' });
                  resolve(body);
                }
              });
            }).catch(err => reject(err));
        }).catch((err) => {
          reject(err);
        });
    }
  });
}
