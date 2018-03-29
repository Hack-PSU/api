const express = require('express');
const functions = require("../helpers/functions");
const aws = require('aws-sdk');
const multer = require('multer');
const multers3 = require('multer-s3');
const path = require('path');
const Ajv = require('ajv');

const authenticator = require("../helpers/auth");
const database = require('../helpers/database');
const constants = require('../helpers/constants');
const TravelReimbursementModel = require('../helpers/TravelReimbursementModel');

const router = express.Router();


const ajv = new Ajv({allErrors: true});


aws.config.update({
    accessKeyId: constants.s3Connection.accessKeyId,
    secretAccessKey: constants.s3Connection.secretAccessKey,
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
        // TODO: Generate filenames during the request to store in db
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


/**
 * @api {post} /users/RSVP confirm the RSVP status for the current user and send a email containing their pin
 * @apiVersion 0.1.1
 * @apiName Set RSVP
 *
 * @apiGroup Users
 * @apiPermission User
 *
 * @apiParam {String} A value to indicate if the user decide to rsvp ['true', 'false']
 *
 * @apiUse AuthArgumentRequired
 * @apiSuccess sends a email with user's pin
 * @apiUse IllegalArgumentError
 */
router.post('/rsvp', (req, res, next) => {
  if (req.body && (typeof req.body.rsvp !== 'undefined')) {
    if (res.locals.user) {
      database.setRSVP(res.locals.user.uid, req.body.rsvp === 'true')
        .then(() => {
          if (req.body.rsvp === 'true') {
            let user = null;
            database.getRegistration(res.locals.user.uid)
              .on('data', (data) => {
                user = data;
              }).on('err', (err) => { // Database registration retrieval
              const error = new Error();
              error.status = 500;
              error.body = err.message;
              console.error(error);
              next(error);
            }).on('end', () => {
              let email = user.email;
              let name = user.firstname;
              let pin = user.pin || 78;
              functions.emailSubstitute(constants.RSVPEmailHtml.text, name, {
                name: name,
                pin: parseInt(pin, 10).toString(14).padStart(3, '0'),
              })
                .then((subbedHTML) => {
                  const request = functions.createEmailRequest(email, subbedHTML, constants.RSVPEmailHtml.subject, "");
                  functions.sendEmail(request.data)
                    .then(() => {
                      res.status(200).send({message: 'success', pin: parseInt(pin, 10).toString(14).padStart(3, '0')});
                      // resolve({'email': request.data.to, 'html': request.data.htmlContent, 'response': 'success'});
                    })
                    .catch((err) => { // Send Email error
                      const error = new Error();
                      error.status = 500;
                      error.body = err.message;
                      console.error(error);
                      next(error);
                    });
                }).catch((err) => { // Email Substitute error
                const error = new Error();
                error.status = 500;
                error.body = err.message;
                console.error(error);
                next(error);
              });
            })
          } // End if
          else {
            res.status(200).send({message: 'success'});
          }
        }).catch((err) => { // Set RSVP error
        const error = new Error();
        error.status = 500;
        error.body = err.message;
        console.error(error);
        next(error);
      });
    } else {
      const error = new Error();
      error.status = 400;
      error.body = {error: 'Could not identify user'};
      console.error(error);
      next(error);
    }
  } else {
    const error = new Error();
    error.status = 400;
    error.body = {error: 'RSVP value must be included'};
    next(error);
  }
});


/**
 * @api {get} /users/rsvp Get the RSVP status for a user
 * @apiVersion 0.1.1
 * @apiName get RSVP status
 *
 * @apiGroup Users
 * @apiPermission User
 *
 * @apiUse AuthArgumentRequired
 * @apiSuccess {Object} Containing the rsvp status based on the uid
 * @apiUse IllegalArgumentError
 */
router.get('/rsvp', (req, res, next) => {
  if (res.locals.user) {
    database.getRSVP(res.locals.user.uid)
      .then((RSVP_status) => {
        res.status(200).send(RSVP_status || { rsvp_status: false });
      }).catch((err) => {
        const error = new Error();
        error.status = err.status || 500;
        error.body = error.message;
        next(error);
      })
  } else {
    const error = new Error();
    error.status = 400;
    error.body = {error: 'Could not identify user'};
    next(error);
  }
});


/**
 * @api {post} /users/travelReimbursement submit travel reimbursement information
 * @apiVersion 0.2.2
 * @apiName Travel Reimbursement
 * @apiGroup users
 * @apiUse AuthArgumentRequired
 * @apiParam {String} fullName first and last names of the user as they would appear on a check.
 * @apiParam {Number} reimbursementAmount the total amount of money they are requesting, as appears on their receipts
 * @apiParam {String} mailingAddress the full postal address of the user
 * @apiParam {enum} groupMembers ["1", "2", "3", "4+"]
 * @apiParam {FILE} [receipt] The receipt files for this user, users can send up to 5 files all under fieldname receipt. (Max size: 5 MB each)
 * @apiPermission valid user credentials
 * @apiSuccess {String} Success
 * @apiUse IllegalArgumentError
 */
router.post('/travelreimbursement', upload.array('receipt', 5), (req, res, next) => {
    if (parseInt(req.body.reimbursementAmount)) {
        req.body.reimbursementAmount = parseInt(req.body.reimbursementAmount);
        if (!(req.body && validateReimbursement(req.body))) {
            const error = new Error();
            error.body = {error: 'Request body must be set and be valid'};
            error.status = 400;
            next(error);
        } else {
            req.body.reimbursementAmount = adjustReimbursementPrice(req.body.reimbursementAmount, req.body.groupMembers);
            // TODO: Set receipt URLs after upload to S3
            req.body.receiptURIs = req.files.map((file) => {
                return 'https://s3.'
                    + constants.s3Connection.region
                    + '.amazonaws.com/'
                    + constants.s3Connection.s3TravelReimbursementBucket
                    + '/'
                    + generateFileName(req.body.fullName, file.fieldname);
            }).join(',');
            database.addTravelReimbursement(new TravelReimbursementModel(req.body))
                .then((result) => {
                    res.status(200).send(
                        {
                            result: "Travel reimbursement request submitted. Final amount: "
                            + req.body.reimbursementAmount +
                            ". This amount is based on the number of people in your party."
                        });
                }).catch((error) => {
                error.status = 500;
                next(error);
            });
            console.log(Number(req.body.reimbursementAmount).toFixed(2));
            res.status(200).send({ response: "Success" });
        }
    } else {
        const error = new Error();
        error.body = {error: 'Reimbursement amount must be a number'};
        error.status = 400;
        next(error);
    }
});

/**
 *
 * @param data
 */
function validateReimbursement(data) {
    const validate = ajv.compile(constants.travelReimbursementSchema);
    return !!validate(data);
}

/**
 *
 * @param price {Number}
 * @param groupMembers {String}
 */
function adjustReimbursementPrice(price, groupMembers) {
    if ((groupMembers === '1' || groupMembers === '2') && price > 50) {
        return 50;
    }
    else if (groupMembers === '3' && price > 60) {
        return 60;
    }
    else if (groupMembers === '4+' && price > 70) {
        return 70;
    }
    else {
        return price;
    }
}

String.prototype.padStart = String.prototype.padStart ? String.prototype.padStart : function(targetLength, padString) {
  targetLength = Math.floor(targetLength) || 0;
  if(targetLength < this.length) return String(this);

  padString = padString ? String(padString) : " ";

  var pad = "";
  var len = targetLength - this.length;
  var i = 0;
  while(pad.length < len) {
    if(!padString[i]) {
      i = 0;
    }
    pad += padString[i];
    i++;
  }

  return pad + String(this).slice(0);
};


module.exports = router;
