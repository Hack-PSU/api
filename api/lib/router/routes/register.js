// /* eslint-disable consistent-return,no-param-reassign */
// import { IStorageService } from '../services/storage/svc/storage.service';
//
// const express = require('express');
// const validator = require('email-validator');
// const path = require('path');
// const fs = require('fs');
// const { logger } = require('../services/logging/logging');
// const { verifyAuthMiddleware } = require('../services/auth/auth');
// const { HACKATHON_NAME, GCS } = require('../assets/constants/constants');
// const { errorHandler500 } = require('../services/functions');
// const database = require('../services/database');
// const StorageService = require('../services/storage/storage_service');
// const { STORAGE_TYPES } = require('../services/storage/storage-factory');
// const { emailSubstitute, createEmailRequest, sendEmail } = require('../services/functions');
// const { Registration } = require('../models/Registration');
// const { PreRegistration } = require('../models/PreRegistration');
// const HttpError = require('../JSCommon/errors');
// const { findList, addSubscriber } = require('../services/communication/email-list/mailchimp.service');
//
// const storage = new StorageService(STORAGE_TYPES.GCS, {
//   bucketName: GCS.resumeBucket,
//   key(req, file, cb) {
//     cb(null, generateFileName(req.body.uid, req.body.firstName, req.body.lastName));
//   },
// });
//
// const router = express.Router();
//
// const EMAIL_TEMPLATE_PATH = '../assets/emails/email_template.html';
// const REGISTRATION_EMAIL_BODY = '../assets/emails/registration_body.html';
// const emailTemplate = fs.readFileSync(path.join(__dirname, EMAIL_TEMPLATE_PATH), 'utf-8');
// const registrationEmailBody = fs.readFileSync(path.join(__dirname, REGISTRATION_EMAIL_BODY), 'utf-8');
// const emailHtml = emailTemplate.replace('$$BODY$$', registrationEmailBody);
//
// /** ****************** HELPER FUNCTIONS ********************** */
//
// /**
//  *
//  * @param uid
//  * @param firstName
//  * @param lastName
//  * @return {string}
//  */
// function generateFileName(uid, firstName, lastName) {
//   return `${uid}-${firstName}-${lastName}-${HACKATHON_NAME}.pdf`;
// }
// const upload: IStorageService = {
//   upload: (req, res, next) => {
//     return null;
//   },
// };
// const upload = storage.upload({
//   fileFilter(req, file, cb) {
//     if (path.extname(file.originalname) !== '.pdf') {
//       const error = new Error();
//       error.status = 400;
//       error.body = 'Only pdfs are allowed';
//       return cb(error);
//     }
//     cb(null, true);
//   },
//   acl: 'publicRead',
// });
//
// /** **************** HELPER MIDDLEWARE ************************* */
// /**
//  *
//  * @param req
//  * @param res
//  * @param next
//  */
// function storeIP(req, res, next) {
//   if (process.env.NODE_ENV !== 'production') {
//     return next();
//   }
//   database.storeIP(req.uow, req.headers['x-appengine-user-ip'], req.headers['user-agent'])
//     .then(() => next())
//     .catch(() => next());
// }
//
//
// /** ******************* ROUTES *************************** */
// /**
//  * @api {post} /register/pre Pre-register for HackPSU
//  * @apiVersion 1.0.0
//  * @apiName Add Pre-Registration
//  * @apiGroup Pre Registration
//  * @apiParam {String} email The email ID to register with
//  * @apiPermission None
//  *
//  * @apiSuccess {String} Success
//  * @apiUse IllegalArgumentError
//  */
// router.post('/pre', (req, res, next) => {
//   if (!req.body ||
//     !req.body.email ||
//     !validator.validate(req.body.email)) {
//     const error = new Error();
//     error.body = { error: 'Request body must be set and must be a valid email' };
//     error.status = 400;
//     return next(error);
//   }
//   let promise = new PreRegistration({ email: req.body.email }, req.uow)
//     .add();
//   if (process.env.APP_ENV !== 'test') {
//     promise = promise
//       .then(() => findList(SUBSCRIBER_LIST))
//       .then(([{ id }]) => addSubscriber(req.body.email, id));
//   }
//   promise
//     .then(() => {
//       res.status(200)
//         .send({ status: 'Success' });
//     })
//     .catch(err => errorHandler500(err, next));
// });
//
//
// /**
//  * @api {post} /register/ Register for HackPSU
//  * @apiVersion 1.0.0
//  * @apiName Add Registration
//  * @apiGroup Registration
//  * @apiPermission UserPermission
//  * @apiParamExample {Object} Request-Example: {
// 	req.header: {
// 		idtoken: <user's idtoken>
// 	}
//
//  	request.body: {
// firstName: "Matt",
//             lastName: "Stewart",
//             gender: "Male",
//             shirtSize: "L",
//             dietaryRestriction: "Vegetarian",
//             allergies: "Peanuts",
//             travelReimbursement: true,
//             firstHackathon: false,
//             university: "University of hackathon",
//             email: matt@email.com,
//             academicYear: "sophomore",
//             major: "Communication"
//             phone: "1234567890"
//             race: "no-disclose"
//             codingExperience: "advanced"
//             uid: "JH123891JDW98E89J3389",
//             eighteenBeforeEvent: true,
//             mlhCOC: true,
//             mlhDCP: true,
//             referral: "facebook",
//             project: "My project description",
//             resume: <FILE_OBJECT>
//     }
//  * @apiUse AuthArgumentRequired
//  * @apiParam {String} firstName First name of the user
//  * @apiParam {String} lastName Last name of the user
//  * @apiParam {String} gender Gender of the user
//  * @apiParam {enum} shirtSize [XS, S, M, L, XL, XXL]
//  * @apiParam {String} [dietaryRestriction] The dietary restictions for the user
//  * @apiParam {String} [allergies] Any allergies the user might have
//  * @apiParam {boolean} travelReimbursement=false
//  * @apiParam {boolean} firstHackathon=false Is this the user's first hackathon
//  * @apiParam {String} university The university that the user attends
//  * @apiParam {String} email The user's school email
//  * @apiParam {String} academicYear The user's current year in school
//  * @apiParam {String} major Intended or current major
//  * @apiParam {String} phone The user's phone number (For MLH)
//  * @apiParam {FILE} [resume] The resume file for the user (Max size: 10 MB)
//  * @apiParam {String} [ethnicity] The user's ethnicity
//  * @apiParam {String} codingExperience The coding experience that the user has
//  * @apiParam {String} uid The UID from their Firebase account
//  * @apiParam {boolean} eighteenBeforeEvent=true Will the person be eighteen before the event
//  * @apiParam {boolean} mlhcoc=true Does the user agree to the mlhcoc?
//  * @apiParam {boolean} mlhdcp=true Does the user agree to the mlh dcp?
//  * @apiParam {String} referral Where did the user hear about the Hackathon?
//  * @apiParam {String} project A project description that the user is proud of
//  * @apiParam {String} expectations What the user expects to get from the hackathon
//  * @apiParam {String} veteran=false Is the user a veteran?
//  *
//  * @apiSuccess {String} Success
//  * @apiUse IllegalArgumentError
//  */
//
// router.post('/', verifyAuthMiddleware, upload.single('resume'), storeIP, (req, res, next) => {
//   /** Converting boolean strings to booleans types in req.body */
//   req.body.travelReimbursement = req.body.travelReimbursement && req.body.travelReimbursement === 'true';
//
//   req.body.firstHackathon = req.body.firstHackathon && req.body.firstHackathon === 'true';
//
//   req.body.eighteenBeforeEvent = req.body.eighteenBeforeEvent && req.body.eighteenBeforeEvent === 'true';
//
//   req.body.mlhcoc = req.body.mlhcoc && req.body.mlhcoc === 'true';
//
//   req.body.mlhdcp = req.body.mlhdcp && req.body.mlhdcp === 'true';
//
//   req.body.uid = res.locals.user.uid;
//
//   if (!(req.body &&
//     validator.validate(req.body.email) &&
//     req.body.eighteenBeforeEvent &&
//     req.body.mlhcoc && req.body.mlhdcp)) {
//     logger.error('Request body:');
//     logger.error(req.body);
//     logger.error('Email validation:');
//     logger.error(validator.validate(req.body.email));
//     const error = new Error();
//     error.body = {
//       error: 'Reasons for error: Request body must be set, must use valid email, ' +
//         'eighteenBeforeEvent mlhcoc and mlhdcp must all be true',
//     };
//     error.status = 400;
//     return next(error);
//   }
//   // Add to database
//   if (req.file) {
//     req.body.resume = storage
//       .uploadedFileUrl(generateFileName(req.body.uid, req.body.firstName, req.body.lastName));
//   }
//   const reg = new Registration(req.body, req.uow);
//   reg
//     .add()
//     .then(() => reg.submit())
//     .then(() => {
//       // Generate confirmation email.
//       const html = emailHtml;
//       return emailSubstitute(html, reg.firstname);
//     })
//     .then((preparedHTML) => {
//       const request = createEmailRequest(reg.email, preparedHTML, 'Thank you for your registration!', '');
//       return sendEmail(request);
//     })
//     .then(() => {
//       res.status(200).send({ response: 'Success' });
//     })
//     .catch((err) => {
//       if (err instanceof HttpError) {
//         return next(err);
//       }
//       const error = new Error();
//       error.body = { error: err.message };
//       if (process.env.NODE_ENV === 'production') {
//         logger.error(reg);
//       }
//       // If duplicate, send 400, else 500.
//       error.status = err.errno === 1062 ? 400 : 500;
//       return next(error);
//     });
// });
//
// module.exports = router;