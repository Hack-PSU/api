const express = require('express');

const router = express.Router();
const validator = require('email-validator');
const authenticator = require('../helpers/auth');
const constants = require('../helpers/constants');
const Ajv = require('ajv');
const path = require('path');

const ajv = new Ajv({allErrors: true});

const aws = require('aws-sdk');
const multer = require('multer');
const multers3 = require('multer-s3');
const database = require("../helpers/database");
const RegistrationModel = require("../helpers/RegistrationModel");

//dependencies
//multer, multer-s3, aws-sdk, request-ip

aws.config.update({
    accessKeyId: constants.s3Connection.accessKeyId,
    secretAccessKey: constants.s3Connection.secretAccessKey,
    region: constants.s3Connection.region,
});

const s3 = new aws.S3();

const storage = multers3({
    s3: s3,
    bucket: constants.s3Connection.s3BucketName,
    serverSideEncryption: 'AES256',
    metadata: function (req, file, cb) {
        console.log(req.body);
        cb(null, {
            fieldName: file.fieldname,
            uid: req.body.uid
        });
    },
    key: function (req, file, cb) {
        cb(null, generateFileName(req.body.uid, req.body.firstNam, req.body.lastName));
    }
});


const upload = multer({
    fileFilter: function (req, file, cb) {
        if (path.extname(file.originalname) !== '.pdf') {
            return cb(new Error('Only pdfs are allowed'));
        }

        cb(null, true);
    },
    storage: storage,
    limits: {fileSize: 1024 * 1024 * 10} //limit to 10MB
});


//const database = require('../helpers/database');


/** **************** HELPER MIDDLEWARE ************************* */

/**
 * Login authentication middleware
 */

router.use((req, res, next) => {

    console.log(req.clientIp);

    if (req.headers.idtoken) {

        authenticator.checkAuthentication(req.headers.idtoken)
            .then((decodedToken) => {

                res.locals.privilege = decodedToken.privilege;
                res.locals.uid = decodedToken.uid;

                next();

            }).catch((err) => {
            const error = new Error();
            error.status = 401;
            error.body = err.message;
            next(error);
        });
    } else {
        const error = new Error();
        error.status = 401;
        error.body = {error: 'ID Token must be provided'};
        next(error);
    }
});


/**
 * @api {post} /register/pre Pre-register for HackPSU
 * @apiVersion 0.1.1
 * @apiName Pre-Registration
 * @apiGroup Registration
 * @apiParam {String} email The email ID to register with
 * @apiPermission None
 *
 * @apiSuccess {String} Success
 * @apiUse IllegalArgumentError
 */
router.post('/pre', (req, res, next) => {
    if (!(req.body && req.body.email && validator.validate(req.body.email))) {
        const error = new Error();
        error.body = {error: 'Request body must be set and must be a valid email'};
        error.status = 400;
        next(error);
    } else {
        database.addPreRegistration(req.body.email)
            .then(() => {
                res.status(200).send("Success");
            }).catch((err) => {
            console.error(err);
            err.status = err.status || 500;
            next(err);
        });
    }
    //     if (process.env.NODE_ENV === 'test') {
    //         database.emailsRef = admin.firestore().collection('pre-registrations-test').doc();
    //     } else {
    //         emailsRef = admin.firestore().collection('pre-registrations').doc();
    //     }
    //     emailsRef.set({email: req.body.email})
    //         .then(() => {
    //             res.status(200).send('Success');
    //         }).catch((err) => {
    //         err.status = 500;
    //         next(err);
    //     }).catch((err) => {
    //         err.status = 500;
    //         next(err);
    //     });
    // }
});


/**
 * @api {post} /register/ Register for HackPSU
 * @apiVersion 0.1.1
 * @apiName Registration
 * @apiGroup Registration
 * @apiUse AuthArgumentRequired
 * @apiParam {string} firstname First name of the user
 * @apiParam {string} lastname sLast name of the user
 * @apiParam {string} gender Gender of the user;
 * @apiParam {enum} shirt_size [XS, S, M, L, XL, XXL]
 * @apiParam {string} [dietary_restriction] The dietary restictions for the user
 * @apiParam {string} [allergies] Any allergies the user might have
 public travel_reimbursement;
 public first_hackathon;
 public university;
 public email;
 public academic_year;
 public major;
 public phone;
 public resume;
 public race;
 public coding_experience;
 public uid;
 public eighteenBeforeEvent;
 public mlh_coc;
 public mlh_dcp;
 public referral;
 public project;
 public expectations;
 public veteran;
 request header {
		idtoken: user's idtoken
	}

 request Body {
		data:{ 
			firstName: {
                type: 'string',
                minLength: 1,
                maxLength: 45,
            },
            lastName: {
                type: 'string',
                minLength: 1,
                maxLength: 45,
            },
            gender: { 
                "enum":  ['Male','Female','Non-Binary','Prefer not to disclose']
            },
            shirtSize:{ 
                "enum": ['XS','S','M','L','XL','XXL']
            },
            dietaryRestriction: {
                "enum": ['Vegetarian','Vegan','Kosher','Allergies']  
            },
            allergies: {
                type: 'string',
                minLength: 1,
                maxLength: 45,
            },
            travel_reimbursement: {
                type: 'boolean'
            }, 
            firstHackathon: {
                type: 'boolean'
            },
            university: {
                type: 'string',
                minLength: 1, 
                maxLength: 200,
            },
            email: {
                type: 'string',
                format: 'email'   
            },
            academicYear: {
                "enum": ["Freshman", "Sophomore", "Junior", "Senior", "Graduate student", "Graduated within last 12 months"]
            },
            major: {
                type: 'string',
                minLength: 1,
                maxLength: 100
            },
            phone: {
                type: 'string', 
                minLength: 1,
                maxLength: 50
            },
            race: {
                type: 'string',
                maxLength: 150
            },
            codingExperience: {
                "enum": ["None","Beginner", "Intermediate", "Advanced"]
            },
            uid: {
                type: 'string',
                maxLength: 150
            },
            eighteenBeforeEvent: {
                type: 'boolean'
            }, 
            mlhCOC: {
                type: 'boolean' 
            },
            mlhDCP: {
                type: 'boolean'
            },
            referral: {
                type: 'string'
            },
            project: { 
                type: 'string'
            }
			
			required: ['firstName', 'lastName', 'gender', 'shirtSize', 'travel_reimbursement', 'firstHackathon', 'email', 'academicYear', 'major', 'phone', 'codingExperience', 'uid', 'eighteenBeforeEvent', 'mlhCOC', 'mlhDCP']
        }, 
        resume: file(size must be below 10MB)}

 * @apiPermission valid user credentials
 *
 * @apiSuccess {String} Success
 * @apiUse IllegalArgumentError
 */

router.post('/', upload.single('resume'), (req, res, next) => {
    console.log(req.body);
    /** Converting boolean strings to booleans types in req.body */
    req.body.travelReimbursement = req.body.travelReimbursement && req.body.travelReimbursement === 'true';

    req.body.firstHackathon = req.body.firstHackathon && req.body.firstHackathon === 'true';

    req.body.eighteenBeforeEvent = req.body.eighteenBeforeEvent && req.body.eighteenBeforeEvent === 'true';

    req.body.mlhcoc = req.body.mlhcoc && req.body.mlhcoc === 'true';

    req.body.mlhdcp = req.body.mlhdcp && req.body.mlhdcp === 'true';

    req.body.veteran = req.body.veteran && req.body.veteran === 'true';


    if (!(req.body && validateRegistration(req.body) && validator.validate(req.body.email) && req.body.eighteenBeforeEvent && req.body.mlhcoc && req.body.mlhdcp)) {
        const error = new Error();
        error.body = {error: 'Reasons for error: Request body must be set, must use valid email, eighteenBeforeEvent mlhcoc and mlhdcp must all be true'};
        error.status = 400;
        next(error);
    } else {
        // Add to database
        if (req.file) {
            req.body.resume = 'https://s3.'
                + constants.s3Connection.region
                + '.amazonaws.com/'
                + constants.s3Connection.s3BucketName
                + '/'
                + generateFileName(req.body.uid, req.body.firstName, req.body.lastName);
        }
        database.addRegistration(new RegistrationModel(req.body))
            .then(() => {
                database.setRegistrationSubmitted(req.body.uid)
                res.status(200).send({response: "Success"});
            }).catch((err) => {
            console.error(err);
            const error = new Error();
            error.body = {error: err.message};
            error.status = 400;
            next(error);
        });
    }


});

function validateRegistration(data) {
    const validate = ajv.compile(constants.registeredUserSchema);
    if (validate(data)) {
        return true;
    } else {
        console.error(ajv.errorsText(validate.errors));
        return false;
    }
}

function generateFileName(uid, firstName, lastName) {
    return uid + '-' + firstName + "-" + lastName + "-HackPSUS2018.pdf"
}


module.exports = router;
