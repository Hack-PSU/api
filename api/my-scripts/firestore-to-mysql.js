var mysql = require('mysql');
const nodecipher = require('node-cipher');
const fs = require('fs');

var admin = require('firebase-admin');
const uuid = require('uuid/v4');

var serviceAccount = require('../hackpsu18-firebase-adminsdk-xf07l-ccc564f4ad.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://hackpsu18.firebaseio.com"
});

nodecipher.decrypt({
    input: 'config.json.aes',
    output: 'config.json',
    password: process.env.decryptPass,
    algorithm: 'aes-256-cbc-hmac-sha256'
}, function (err, opts) {
    if (err) throw err;

    console.log('It worked!');
    const config = require('./config.json');

    var connection = mysql.createConnection({
        host: config.RDS_HOSTNAME,
        user: config.RDS_USERNAME,
        password: config.RDS_PASSWORD,
        port: config.RDS_PORT
    });

    connection.connect(function(err) {
        if (err) {
          console.error('Database connection failed: ' + err.stack);
          return;
        }
        console.log('Connected to database.');
        const db = admin.firestore();
        const preregref = db.collection('pre-registrations');
        var allEmails = preregref.get()
            .then(snapshot => {
                snapshot.forEach(doc => {
                    var sql = "INSERT INTO ebdb.PRE_REGISTRATION (id, email) VALUES (?,?)";
                    connection.query(sql, [uuid().replace(/-/g,""), doc.data().email], function (err, results, fields) {
                        if (err) {
                            console.error(err);
                        }
                        console.log(results);
                    })
                });
            }).catch(err => {
                console.log('Error getting documents', err);
            });
      });
      fs.unlinkSync("./config.json");
});