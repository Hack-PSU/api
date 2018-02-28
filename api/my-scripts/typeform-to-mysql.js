const https = require('https');
const admin = require('firebase-admin');
const {exec} = require('child_process');
const nodecipher = require('node-cipher');
const fs = require('fs');
const mysql = require('mysql');
const AWS = require('aws-sdk');
const squel = require('squel');
const firebase = require('firebase');

const emailHTML = fs.readFileSync('email.html', 'utf-8');
const fbconfig = {
    apiKey: "AIzaSyCpvAPdiIcqKV_NTyt6DZgDUNyjmA6kwzU",
    authDomain: "hackpsu18.firebaseapp.com",
    databaseURL: "https://hackpsu18.firebaseio.com",
    projectId: "hackpsu18",
    storageBucket: "hackpsu18.appspot.com",
    messagingSenderId: "1002677206617"
};
firebase.initializeApp(fbconfig);

const S3 = new AWS.S3();
const typeform_path = '/v1/form/U1VCgs?key=ad531e563f5813b53e3c5f63adae8183893539ff&completed=true&offset=0&limit=4000';
const typeform_host = 'api.typeform.com';
const options = {
    host: typeform_host,
    path: typeform_path,
    headers: {
        'User-Agent': 'request'
    }
};

const serviceAccount = require('../hackpsu18-firebase-adminsdk-xf07l-3905b29787');

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
const config = require('./config.json');
let connection = mysql.createConnection({
    host: config.RDS_HOSTNAME,
    user: config.RDS_USERNAME,
    password: config.RDS_PASSWORD,
    port: config.RDS_PORT
});
let dbConnected = new Promise((resolve, reject) => {
    connection.connect(function (err) {
        if (err) {
            console.error('Database connection failed: ' + err.stack);
            reject(err);
        } else {
            console.log('Connected to database.');
            resolve();
        }
    });
});

getTypeformResponses(options)
    .then((responses) => {
            console.log(responses);
            for (let i = 0; i < 1; i++) {
                let postObj = parseTypeformResponse(responses[i].answers);
                console.log(postObj);
                let prom = null;
                if (postObj.resume) {
                    prom = downloadFile(postObj.resume);
                } else {
                    prom = new Promise((res) => {
                        res();
                    });
                }
                prom.then((filename) => {
                    console.log(filename);
                    generateLogin(postObj.email)
                        .then((result) => {
                            console.log(result);
                            postObj.uid = result.uid;
                            if (filename) {
                                const params = {
                                    Bucket: config.AWS_BUCKET,
                                    ACL: 'public-read',
                                    ServerSideEncryption: "AES256",
                                    Key: generateFileName(postObj.uid, postObj.firstname, postObj.lastname),
                                    Body: fs.createReadStream(postObj.resume),
                                };
                                S3.upload(params, (err, data) => {
                                    console.log(err, data);
                                    fs.unlinkSync(filename);
                                    console.log("File uploaded");
                                });
                                postObj.resume = 'https://s3.us-east-2.amazonaws.com/hackpsus2018-resumes/'
                                    + generateFileName(postObj.uid, postObj.firstName, postObj.lastName);
                            }
                            patchMySql(postObj)
                                .then((result) => {
                                    console.log(result);
                                    // module.exports.sendEmail(result.email, result.firstname);
                                }).catch((error) => {
                                console.log("Patch SQL error");
                                console.error(error);
                            });
                        }).catch((error) => {
                        console.log("Firebase auth generate error");
                        console.error(error);
                    });
                });
            }
        }
    ).catch(err => console.error(err)
);

/**
 *
 * @param options
 * @return {Promise<any>}
 */
function getTypeformResponses(options) {
    return new Promise((resolve, reject) => {
        https.get(options, function (response) {
            // Continuously update stream with data
            let body = '';
            response.on('data', function (d) {
                body += d;
            });
            response.on('end', function () {
                console.log("typeform data end");
                // Data reception is done, do whatever with it!
                let parsed = JSON.parse(body);
                let responses = parsed.responses;
                resolve(responses);
            });
            response.on('error', function (err) {
                console.log("typeform error");
                console.log(err);
                reject(err);
            });
        });
    });
}

/**
 *
 * @param postObj
 * @return Promise<any>
 */
function patchMySql(postObj) {
    return new Promise((resolve, reject) => {
        console.log(postObj);
        const query = squel.insert({autoQuoteTableNames: true, autoQuoteFieldNames: true})
            .into('REGISTRATION')
            .setFieldsRows([
                postObj
            ]).toParam();
        query.text = query.text.concat(';');
        dbConnected.then(() => {
            connection.query(query.text, query.values, (err, response) => {
                if (err) {
                    reject(err);
                } else {
                    console.log(response);
                    resolve(postObj);
                }
            });
        });
    });
}

/**
 *
 * @param email
 * @return {Promise<admin.auth.UserRecord>}
 */
function generateLogin(email) {
    return admin.auth().createUser({email, password: "password"});
}

/**
 *
 * @param email
 * @param name
 * @return {Promise<any>}
 */
module.exports = function sendEmail(email, name) {
    return new Promise((resolve, reject) => {
        firebase.auth().signInWithEmailAndPassword("admin@email.com", "password")
            .then((user) => {
                console.log(user);
                user.getIdToken(true)
                    .then((idtoken) => {
                        console.log(idtoken);
                        const options = {
                            hostname: 'api.hackpsu.org',
                            port: 443,
                            path: '/v1/admin/email',
                            method: 'POST',
                            headers: {
                                'content-type': 'application/json',
                                idtoken: idtoken,
                            },
                            body: {
                                emails: [{
                                    email: email,
                                    name: name,
                                    substitutions: {
                                        reset_url: "https://app.hackpsu.org/forgot?email=" + email,
                                    }
                                }],
                                subject: "Thank you for registering with HackPSU!",
                                html: emailHTML,
                            }
                        };
                        console.log(options);
                        const req = https.request(options, (res) => {
                            res.on('data', (d) => {
                                process.stdout.write(d);
                            });
                            res.on('end', () => {
                                resolve();
                            })
                        });
                        req.on('error', (err => {
                            console.error(err);
                        }));
                        req.end();
                    }).catch((err) => reject(err));
            }).catch((err) => {
            reject(err);
        })
    });
};

/**
 *
 * @param url
 */
function downloadFile(url) {
    return new Promise((resolve, reject) => {
        exec('node file_download.js ' + url, (err, stdout, stderr) => {
            if (err) {
                reject(err);
            } else {
                if (stderr) {
                    reject(stderr);
                } else {
                    resolve(stdout);
                }
            }
        });
    });
}

/**
 *
 * @param answers
 * @return {{email: *, firstname: *, lastname: *, gender: *, university: *, academic_year: *, shirt_size: *, resume: *, eighteenBeforeEvent: *, dietary_restriction: *, allergies: *, travel_reimbursement: boolean, first_hackathon: boolean, major: *, mlhcoc: boolean, mlhdcp: boolean}}
 */
function parseTypeformResponse(answers) {
    return {
        email: answers.email_QwRg7UM03uxX,
        firstname: answers.textfield_eynmIPUXHZc8,
        lastname: answers.textfield_me3toAQqUkwo,
        gender: answers.list_dxdEOTJvOx8T_choice,
        university: answers.dropdown_G0E5omVm2YwJ,
        academic_year: answers.list_gkIwLiPgjvXr_choice,
        shirt_size: answers.list_Af2rTKG55bjb_choice || null,
        resume: answers.fileupload_GcGHbEVbV5Ok || null,
        eighteenBeforeEvent: answers.yesno_ZAkOzcpuImvJ === '1',
        dietary_restriction: answers.list_DxiH20eGF0Tu_choice_vAkRfC2EhvH0 || null,
        allergies: answers.textarea_XsQhSVLovDTw || null,
        travel_reimbursement: answers.yesno_f6q1nBZ76jC9 === '1',
        first_hackathon: answers.yesno_gQglhK18g9zn === '1',
        major: answers.textfield_salRIazBSILV,
        mlhcoc: answers.terms_yRNVPi1Zf3fj === '1',
        mlhdcp: answers.terms_yRNVPi1Zf3fj === '1',
    }
}

/**
 *
 * @param uid
 * @param firstName
 * @param lastName
 * @return {string}
 */
function generateFileName(uid, firstName, lastName) {
    return uid + '-' + firstName + "-" + lastName + "-HackPSUS2018.pdf"
}
