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
    acl: 'public-read',
    serverSideEncryption: 'AES256',
    metadata: function (req, file, cb) {
        cb(null, {
            fieldName: file.fieldname,
            uid: req.body.uid
        });
    },
    key: function (req, file, cb) {
        cb(null, generateFileName(req.body.uid, req.body.firstName, req.body.lastName));
    }
});


const upload = multer({
    fileFilter: function (req, file, cb) {
        if (path.extname(file.originalname) !== '.pdf') {
            const error = new Error();
            error.status = 400;
            error.body = 'Only pdfs are allowed';
            return cb(error);
        }

        cb(null, true);
    },
    storage: storage,
    limits: {fileSize: 1024 * 1024 * 10} //limit to 10MB
});


/** **************** HELPER MIDDLEWARE ************************* */

/**
 * Login authentication middleware
 */

function checkAuthentication(req, res, next) {
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
}

/**
 *
 * @param req
 * @param res
 * @param next
 */
function storeIP(req, res, next) {
    if (process.env.NODE_ENV === 'prod') {
        database.storeIP(req.headers['http_x_forwarded_for'], req.headers['user-agent'])
            .then(() => {
                next();
            }).catch(() => {
            next();
        })
    } else {
        next();
    }
}


/********************* ROUTES ****************************/
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
            err.status = err.status || 500;
            next(err);
        });
    }
});


/**
 * @api {post} /register/ Register for HackPSU
 * @apiVersion 0.1.1
 * @apiName Registration
 * @apiGroup Registration
 * @apiParam {Object} data:
 * @apiParamExample {Object} Request-Example: {
	req.header: {
		idtoken: <user's idtoken>
	}

 	request.body: {
			firstName: "Matt",
            lastName: "Stewart",
            gender: "Male",
            shirtSize: "L",
            dietaryRestriction: "Vegetarian",
            allergies: "Peanuts",
            travelReimbursement: true,
            firstHackathon: false,
            university: "University of hackathon",
            email: matt@email.com,
            academicYear: "sophomore",
            major: "Communication"
            phone: "1234567890"
            race: "no-disclose"
            codingExperience: "advanced"
            uid: "JH123891JDW98E89J3389",
            eighteenBeforeEvent: true,
            mlhCOC: true,
            mlhDCP: true,
            referral: "facebook",
            project: "My project description",
            resume: https://s3.aws.com/link-to-file
    }
 * @apiUse AuthArgumentRequired
 * @apiParam {String} firstname First name of the user
 * @apiParam {String} lastname Last name of the user
 * @apiParam {String} gender Gender of the user
 * @apiParam {enum} shirt_size [XS, S, M, L, XL, XXL]
 * @apiParam {String} [dietary_restriction] The dietary restictions for the user
 * @apiParam {String} [allergies] Any allergies the user might have
 * @apiParam {boolean} travelReimbursement=false
 * @apiParam {boolean} firstHackathon=false Is this the user's first hackathon
 * @apiParam {String} university The university that the user attends
 * @apiParam {String} email The user's school email
 * @apiParam {String} academicYear The user's current year in school
 * @apiParam {String} major Intended or current major
 * @apiParam {String} phone The user's phone number (For MLH)
 * @apiParam {FILE} [resume] The resume file for the user (Max size: 10 MB)
 * @apiParam {String} [ethnicity] The user's ethnicity
 * @apiParam {String} codingExperience The coding experience that the user has
 * @apiParam {String} uid The UID from their Firebase account
 * @apiParam {boolean} eighteenBeforeEvent=true Will the person be eighteen before the event
 * @apiParam {boolean} mlhcoc=true Does the user agree to the mlhcoc?
 * @apiParam {boolean} mlhdcp=true Does the user agree to the mlh dcp?
 * @apiParam {String} referral Where did the user hear about the Hackathon?
 * @apiParam {String} project A project description that the user is proud of
 * @apiParam {String} expectations What the user expects to get from the hackathon
 * @apiParam {String} veteran=false Is the user a veteran?
 * @apiPermission valid user credentials
 *
 * @apiSuccess {String} Success
 * @apiUse IllegalArgumentError
 */

router.post('/', checkAuthentication, upload.single('resume'), storeIP, (req, res, next) => {
    /** Converting boolean strings to booleans types in req.body */
    req.body.travelReimbursement = req.body.travelReimbursement && req.body.travelReimbursement === 'true';

    req.body.firstHackathon = req.body.firstHackathon && req.body.firstHackathon === 'true';

    req.body.eighteenBeforeEvent = req.body.eighteenBeforeEvent && req.body.eighteenBeforeEvent === 'true';

    req.body.mlhcoc = req.body.mlhcoc && req.body.mlhcoc === 'true';

    req.body.mlhdcp = req.body.mlhdcp && req.body.mlhdcp === 'true';

    if (!(req.body && validateRegistration(req.body) && validator.validate(req.body.email) && req.body.eighteenBeforeEvent && req.body.mlhcoc && req.body.mlhdcp)) {
        console.error('Request body:');
        console.error(req.body);
        console.error('Registration validation:');
        console.error(validateRegistration(req.body));
        console.error('Email validation:');
        console.error(validator.validate(req.body.email));
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
                database.setRegistrationSubmitted(req.body.uid);
                res.status(200).send({response: "Success"});
            }).catch((err) => {
            const error = new Error();
            error.body = {error: err.message};
            error.status = 400;
            next(error);
        });
    }


});

/**
 *
 * @param data
 */
function validateRegistration(data) {
    const validate = ajv.compile(constants.registeredUserSchema);
    return !!validate(data);
}

function generateFileName(uid, firstName, lastName) {
    return uid + '-' + firstName + "-" + lastName + "-HackPSUS2018.pdf"
}


module.exports = router;
