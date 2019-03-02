const https = require('https');
const request = require('request');
const admin = require('firebase-admin');
const {exec} = require('child_process');
const nodecipher = require('node-cipher');
const fs = require('fs');
const mysql = require('mysql');
const AWS = require('aws-sdk');
const squel = require('squel');
const firebase = require('firebase');
var validUrl = require('valid-url');

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
process.stdin.resume();//so the program will not close instantly

function exitHandler(options, err) {
    if (options.cleanup) {
        fs.unlinkSync('./config.json');
        console.log('clean');
    }
    if (err) console.log(err.stack);
    if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null, {cleanup: true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit: true}));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit: true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit: true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit: true}));
let connection = mysql.createConnection({
    host: config.RDS_HOSTNAME,
    user: config.RDS_USERNAME,
    password: config.RDS_PASSWORD,
    port: config.RDS_PORT,
    database: 'ebdb'
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

getTypeformResponses(options) // Load all typeform data
    .then(async (responses) => {
            for (let i = 0; i < responses.length; i++) { // For all responses
                await new Promise((resolve, reject) => {
                    let postObj = parseTypeformResponse(responses[i].answers); // Parse it to follow the SQL structure
                    console.log(postObj);
                    let prom = null;
                    if (postObj.resume) {
                        prom = downloadFile(postObj.resume); // Download the file from the typeform link
                    } else {
                        prom = new Promise((res) => {
                            res();
                        });
                    }
                    prom.then((filename) => { // On complete download
                        if (filename) {
                            filename = filename.replace(/\n/g, '');// Strip the newline
                            fs.renameSync(filename, filename.replace(/\s/g, '_'));
                            console.log(filename);
                        }
                        generateLogin(postObj.email) // Generate a login for the user
                            .then((result) => {
                                console.log(result);
                                postObj.uid = result.uid;
                                if (filename) {
                                    const params = {
                                        Bucket: config.AWS_BUCKET,
                                        ACL: 'public-read',
                                        ServerSideEncryption: "AES256",
                                        Key: generateFileName(postObj.uid, postObj.firstname, postObj.lastname),
                                        Body: fs.createReadStream('./' + filename),
                                    };
                                    S3.upload(params, (err, data) => { //Upload resume to S3
                                        console.error(err);
                                        console.log(data);
                                        fs.unlinkSync('./' + filename);
                                        console.log("File uploaded");
                                    });
                                    postObj.resume = 'https://s3.us-east-2.amazonaws.com/hackpsus2018-resumes/'
                                        + generateFileName(postObj.uid, postObj.firstname, postObj.lastname);
                                }
                                patchMySql(postObj) // Add to SQL
                                    .then((result) => {
                                        console.log(result);
                                        sendEmail(result.email, result.firstname) //Send out the email
                                            .then((result) => {
                                                console.log(result);
                                                resolve(result);
                                            }).catch(err => console.error(err));
                                    }).catch((error) => {
                                    console.error("Patch SQL error");
                                    console.error(error);
                                    reject(error);
                                });
                            }).catch((error) => {
                            console.error("Firebase auth generate error");
                            console.error(error);
                            reject(error);
                        });
                    });
                });
            }
        }
    ).catch(err => console.error(err)
);

/**
 * Gets all responses from the typeform
 * @param options
 * @return {Promise<any[]>}
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
                    if (err.errno === 1062) {
                        resolve(postObj);
                        console.log("SQL already has the data. Skipping.");
                    } else {
                        reject(err);
                    }
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
    return new Promise((resolve, reject) => {
        admin.auth().createUser({email, password: "password"})
            .then(resolve)
            .catch((error) => {
                if (error.errorInfo.code === 'auth/email-already-exists') {
                    admin.auth().getUserByEmail(email)
                        .then(resolve)
                        .catch(reject);
                } else {
                    reject(error);
                }
            });
    });
}

/**
 *
 * @param email
 * @param name
 * @return {Promise<any>}
 */
function sendEmail(email, name) {
    const emails = fs.readFileSync('emails.txt', 'utf-8');
    return new Promise((resolve, reject) => {
        if (emails.indexOf(email) !== -1) {
            resolve();
        } else {
            firebase.auth().signInWithEmailAndPassword("firebase@email.com", "password")
                .then((user) => {
                    console.log(user);
                    user.getIdToken(true)
                        .then((idtoken) => {
                            console.log(idtoken);
                            const options = {
                                uri: 'https://api.hackpsu.org/v1/firebase/email',
                                method: 'POST',
                                headers: {
                                    idtoken: idtoken,
                                },
                                json: {
                                    emails: [{
                                        email: email,
                                        name: name,
                                        substitutions: {
                                            url: "https://app.hackpsu.org/forgot?email=" + email,
                                        }
                                    }],
                                    subject: "Thank you for registering with HackPSU!",
                                    html: emailHTML,
                                }
                            };
                            console.log(options);
                            request(options, (err, res, body) => {
                                if (err) {
                                    console.error(err);
                                    reject(err);
                                } else {
                                    fs.writeFileSync('emails.txt', emails + email+'\n', {encoding: 'utf-8'});
                                    resolve(body);
                                }
                            });
                        }).catch((err) => reject(err));
                }).catch((err) => {
                reject(err);
            });
        }
    });
}

/**
 *
 * @param url
 * @return {Promise<string>} the name of the downloaded file
 */
function downloadFile(url) {
    return new Promise((resolve, reject) => {
        if (!validUrl.isHttpsUri(url)) {
            reject("Not a valid URL");
        } else {
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
        }
    });
}

/**
 *
 * @param answers
 * @return {{email: *, firstname: *, lastname: *, gender: *, university: *, academic_year: *, shirt_size: *, resume: *, eighteenBeforeEvent: *, dietary_restriction: *, allergies: *, travel_reimbursement: boolean, first_hackathon: boolean, major: *, mlhcoc: boolean, mlhdcp: boolean}}
 */
function parseTypeformResponse(answers) {
    return {
        email: answers.email_QwRg7UM03uxX.replace(/\s/g, ''),
        firstname: answers.textfield_eynmIPUXHZc8,
        lastname: answers.textfield_me3toAQqUkwo,
        gender: answers.list_dxdEOTJvOx8T_choice,
        university: answers.dropdown_G0E5omVm2YwJ || null,
        academic_year: answers.list_gkIwLiPgjvXr_choice || null,
        shirt_size: answers.list_Af2rTKG55bjb_choice || null,
        resume: answers.fileupload_GcGHbEVbV5Ok || null,
        eighteenBeforeEvent: answers.yesno_ZAkOzcpuImvJ === '1',
        dietary_restriction: answers.list_DxiH20eGF0Tu_choice_vAkRfC2EhvH0 || null,
        allergies: answers.textarea_XsQhSVLovDTw || null,
        travel_reimbursement: answers.yesno_f6q1nBZ76jC9 === '1',
        first_hackathon: answers.yesno_gQglhK18g9zn === '1',
        major: answers.textfield_salRIazBSILV || null,
        mlh_coc: answers.terms_yRNVPi1Zf3fj === '1',
        mlh_dcp: answers.terms_yRNVPi1Zf3fj === '1',
        submitted: true
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
