var https = require('https');
var request = require('request');
var admin = require('firebase-admin');
var typeform_path = '/v1/form/U1VCgs?key=ad531e563f5813b53e3c5f63adae8183893539ff&completed=true&offset=0&limit=4000';
var typeform_host = 'api.typeform.com';
const nodecipher = require('node-cipher');
const fs = require('fs');
const mysql = require('mysql');
var typeformWorking = true;
var options = {
    host: typeform_host,
    path: typeform_path,
    headers: {
        'User-Agent': 'request'
    }
};

var serviceAccount = require('../hackpsu18-firebase-adminsdk-xf07l-3905b29787');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://hackpsu18.firebaseio.com"
});

nodecipher.decryptSync({
    input: 'config.json.aes',
    output: 'config.json',
    password: process.env.decryptPass,
    algorithm: 'aes-256-cbc-hmac-sha256'
});

console.log('It worked!');
const config = require('./config.json');

let connection = mysql.createConnection({
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
});

https.get(options, function (response) {
    // Continuously update stream with data
    var body = '';
    response.on('data', function (d) {
        body += d;
    });
    response.on('end', function () {
        console.log("typeform data end");
        // Data reception is done, do whatever with it!
        var parsed = JSON.parse(body);
        var responses = parsed.responses;

        console.log(responses);

        for (var i = 0; i < responses.length; i++) {
            var postObj = {
            }
            //generateLogin(postObj.email)
            //.then((result) => {
                //console.log(result);
                //patchMySql(postObj).then((result) => {
                //                console.log(result);
                //                sendEmail(result.email);
                //                }).catch((error) => {
                //                  console.log("Patch SQL error");
                //                  console.error(error);
                //                  });
            //}).catch((error) => {
            //    console.log("Firebase auth generate error");
            //    console.error(error);
            //});
        }
    });
    response.on('error', function (err) {
        console.log("typeform error");
        console.log(err);
    });
});

function patchMySql(postObj) {

}

function generateLogin(email) {
    return admin.auth().createUser({email, password: "password"});
}
