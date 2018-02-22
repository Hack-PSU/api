const express = require('express');

const router = express.Router();
const admin = require('firebase-admin');
const validator = require('email-validator');
const authenticator = require('../helpers/auth');
const constants = require('../helpers/constants');
const Ajv = require('ajv');
const path = require('path');

const ajv = new Ajv({allErrors: true});

const aws = require('aws-sdk');
const multer = require('multer');
const multers3 = require('multer-s3');

//dependencies
//multer, multer-s3, aws-sdk, request-ip

aws.config.update({
    secretAccessKey: '4oSXI2ppUhzIpZ17XJlYWiqrZLzMPl+MyDezgsYd',
    accessKeyId: 'AKIAJMHIEHWHLXVVOG2Q',
    region: 'us-east-2'
});

const s3 = new aws.S3();   

const storage = multers3({ 
	s3: s3,
	bucket: 'hackpsus2018-resumes',
	metadata: function (req, file, cb) {
      cb(null, {fieldName: file.fieldname,
      			uid: req.body.data.uid});
    },
    key: function (req, file, cb) {
       cb(null,req.body.data.uid + '-' + req.body.data.firstName + "-" + req.body.data.lastName + "-HackPSUS2018.pdf");
    }
})


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

	console.log(req.clientIp)

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
 * @apiParam {Object} data: 
 * @apiParamExample {Object} Request-Example: {
	req.header: {
		idtoken: user's idtoken
	}

 	request.body: {
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
            travelReimbursement: {
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
			
			required: ['firstName', 'lastName', 'gender', 'shirtSize', 'travelReimbursement', 'firstHackathon', 'email', 'academicYear', 'major', 'phone', 'codingExperience', 'uid', 'eighteenBeforeEvent', 'mlhCOC', 'mlhDCP']
        }, 
        resume: file(size must be below 10MB)} 
    }

 * @apiPermission valid user credentials
 *
 * @apiSuccess {String} Success
 * @apiUse IllegalArgumentError
 */

router.post('/', upload.single('resume'), (req,res,next) => {
	
	if(req.body.data.travelReimbursement == 'true'){ 
		req.body.data.travelReimbursement = true;
	} else {
		req.body.data.travelReimbursement = false;
	}

	if(req.body.data.fisrtHackathon == 'true'){ 
		req.body.data.firstHackathon = true;
	} else {
		req.body.data.firstHackathon = false;
	}

	if(req.body.data.eighteenBeforeEvent == 'true'){ 
		req.body.data.eighteenBeforeEvent = true;
	} else {
		req.body.data.eighteenBeforeEvent = false;
	}

	if(req.body.data.mlhCOC == 'true'){ 
		req.body.data.mlhCOC = true;
	} else {
		req.body.data.mlhCOC = false;
	}

	if(req.body.data.mlhDCP == 'true'){ 
		req.body.data.mlhDCP = true;
	} else {
		req.body.data.mlhDCP = false;
	}


	if (!(req.body && req.body.data && validateRegistration(req.body.data) && validator.validate(req.body.data.email) && req.body.data.eighteenBeforeEvent && req.body.data.mlhCOC && req.body.data.mlhDCP)) {
        const error = new Error();
        error.body = {error: 'Reasons for error: Request body must be set, data object must be set, must use valid email, eighteenBeforeevent mlhCOC and mlhDCP must all be true'};
        error.status = 400;
        next(error);
    } else{
    res.status(200).send("Success");
    }


});

function validateRegistration(data){
	const validate = ajv.compile(constants.registeredUserSchema);
                if (validate(data)) {
                	return true;                  
                } else {              
                   console.log(ajv.errorsText(validate.errors));
                    return false;
                }
}


module.exports = router;
