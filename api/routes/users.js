const express = require('express');
const authenticator = require("../helpers/auth");

const database = require('../helpers/database');

const constants = require('../helpers/constants');

const router = express.Router();

const path = require('path');

const Ajv = require('ajv');

const ajv = new Ajv({allErrors: true});

const aws = require('aws-sdk');
const multer = require('multer');
const multers3 = require('multer-s3');


//TODO: UNCOMMENT THIS CODE
// aws.config.update({
//     accessKeyId: constants.s3Connection.accessKeyId,
//     secretAccessKey: constants.s3Connection.secretAccessKey,
//     region: constants.s3Connection.region,
// });

aws.config.update({
    accessKeyId: 'AKIAJMHIEHWHLXVVOG2Q',
    secretAccessKey: '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',
    region: constants.s3Connection.region,
});


const s3 = new aws.S3();

const storage = multers3({
    s3: s3,
    bucket: constants.s3Connection.s3TravelReimbursementBucket,
    acl: 'public-read',
    serverSideEncryption: 'AES256',
    metadata: function (req, file, cb) {
        cb(null, {
            fieldName: file.fieldname,
        });
    },
    key: function (req, file, cb) {
        cb(null, generateFileName(req.body.fullName, file));
    }
});

function generateFileName(fullName, file) {
    return fullName + "-receipt-" + file.originalname;
}

const upload = multer({
    fileFilter: function (req, file, cb) {
        if (path.extname(file.originalname) !== '.jpeg' && path.extname(file.originalname) !== '.png' && path.extname(file.originalname) !== '.jpg') {
            return cb(new Error('Only jpeg, jpg, and png are allowed'));
        }
        cb(null, true);
    },
    storage: storage,
    limits: {fileSize: 1024 * 1024 * 5} //limit to 5MB
});

/************* HELPER FUNCTIONS **************/
/**
 * User authentication middleware
 */
router.use((req, res, next) => {
    if (req.headers.idtoken) {
        authenticator.checkAuthentication(req.headers.idtoken)
            .then((decodedToken) => {
                res.locals.user = decodedToken;
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


/************* ROUTING MIDDLEWARE ************/
/**
 * @api {get} /users Get the privilege information for the current user
 * @apiVersion 0.1.2
 * @apiName Get user privilege information
 * @apiGroup Users
 * @apiPermission User
 *
 * @apiUse AuthArgumentRequired
 *
 * @apiSuccess {Object} JSON Object with user's data
 */
router.get('/', (req, res, next) => {
    if (res.locals.user) {
        res.status(200).send({admin: res.locals.user.admin, privilege: res.locals.user.privilege});
    } else {
        const error = new Error();
        error.status = 500;
        error.body = {error: 'Could not retrieve user information'};
        next(error);
    }
});

/**
 * @api {get} /users/registration Get the registration information for the current user
 * @apiVersion 0.2.1
 * @apiName Get user registration information
 * @apiGroup Users
 * @apiPermission User
 *
 * @apiUse AuthArgumentRequired
 *
 * @apiSuccess {Object} JSON Object with user's data
 */
router.get('/registration', (req, res, next) => {
   if (res.locals.user) {
       let user = null;
       database.getRegistration(res.locals.user.uid)
           .on('data', (data) => {
               user = data;
           }).on('err', (err) => {
           const error = new Error();
           error.status = 500;
           error.body = err.message;
           next(error);
       }).on('end', () => {
          res.status(200).send(user);
       });
   } else {
       const error = new Error();
       error.status = 500;
       error.body = {error: 'Could not retrieve user information'};
       next(error);
   }
});




/*
 * @api {post} /users/travelReimbursement submit travel reimbursement information
 * @apiVersion 0.1.1
 * @apiName Travel Reimbursement
 * @apiGroup users
 * @apiUse AuthArgumentRequired
 * @apiParam {String} fullName first and last names of the user as they would appear on a check.
 * @apiParam {Number} reimbursementAmount the total amount of money they are requesting, as appears on their receipts
 * @apiParam {String} mailingAddress the full postal address of the user
 * @apiParam {enum} groupMembers ["1", "2", "3", "+4"]
 * @apiParam {FILE} [receipt] The receipt files for this user, users can send up to 5 files all under fieldname receipt. (Max size: 5 MB each)
 * @apiPermission valid user credentials
 * @apiSuccess {String} Success
 * @apiUse IllegalArgumentError
 */
router.post('/travelreimbursement', upload.array('receipt', 5), (req, res, next) => {

 req.body.reimbursementAmount = parseInt(req.body.reimbursementAmount);

req.body.reimbursementAmount= adjustReimbursementPrice(req.body.reimbursementAmount, req.body.groupMembers);

 if (!(req.body && validateReimbursement(req.body))) {
        const error = new Error();
        error.body = {error: 'Reasons for error: Request body must be set and pass validation'};
        error.status = 400;
        next(error);
    } else { 

    	//TODO:
    	//Add to database
    	console.log(Number(req.body.reimbursementAmount).toFixed(2));
    	res.status(200).send({response: "Success"});

    }

});

function validateReimbursement(data) {
    const validate = ajv.compile(constants.travelReimbursementSchema);
    return !!validate(data);
}

function adjustReimbursementPrice(price, groupMembers){

		if( (groupMembers == '1' || groupMembers == '2') && price > 50){ 
			return 50;
		}
		else if(groupMembers == '3' && price > 60){
			return 60;
		}
		else if(groupMembers == '+4' && price > 70){
			return 70; 
		}
		else{
			return price;
		}

}



module.exports = router;
