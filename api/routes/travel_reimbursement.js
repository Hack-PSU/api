const express = require('express')
const { travelReimbursementSchema } = require('../assets/schemas/load-schemas')(['travelReimbursementSchema']);
const TravelReimbursement = require('../models/TravelReimbursement');
const { verifyAuthMiddleware } = require('../services/auth')
const StorageService = require('../services/storage_service');
const { STORAGE_TYPES } = require('../services/factories/storage_factory');
const { logger } = require('../services/logging');
const storage = new StorageService(STORAGE_TYPES.GCS, {
  bucketName: constants.GCS.travelReimbursementBucket,
  key(req, file, cb) {
    cb(null, generateFileName(req.body.uid, req.body.firstName, req.body.lastName));
  },
});

const router = express.Router();

/** *********** HELPER FUNCTIONS ************* */

// file type management
const upload = storage.upload({
  fileFilter(req, file, cb) {
    if (path.extname(file.originalname) !== '.jpeg' &&
      path.extname(file.originalname) !== '.png' &&
      path.extname(file.originalname) !== '.jpg') {
      return cb(new Error('Only jpeg, jpg, and png are allowed'));
    }
    cb(null, true);
  },
  limits: { fileSize: 1024 * 1024 * 5 }, // limit to 5MB
});

/**
 *
 * @param data
 */
function validateReimbursement(data) {
  const validate = ajv.compile(travelReimbursementSchema);
  const result = !!validate(data);
  logger.error(validate.errors);
  return result;
}

/**
 *
 * @param fullName
 * @param file
 * @returns {string}
 */
function generateFileName(fullName, file) {
  return `${fullName}-receipt-${file.originalname}`;
}

/**
 *
 * @param price {Number}
 * @param groupMembers {String}
 */
function adjustReimbursementPrice(price, groupMembers) {
  if ((groupMembers === '1' || groupMembers === '0') && price > 50) {
    return 50;
  } else if (groupMembers === '2' && price > 60) {
    return 60;
  } else if (groupMembers === '3' && price > 70) {
    return 70;
  } else if (price > 70) {
    return 70;
  }

  return price;
}

/**
 *
 * @param fullName
 * @param file
 * @returns {string}
 */
function generateFileName(fullName, file) {
  return `${fullName}-receipt-${file.originalname}`;
}


/** *********** ROUTING MIDDLEWARE *********** */

//maybes changes
router.use(verifyAuthMiddleware)

/**
 * @api {post} /users/reimbursement submit travel reimbursement information
 * @apiVersion 1.0.0
 * @apiName Travel Reimbursement
 * @apiGroup Travel Reimbursement
 * @apiUse AuthArgumentRequired
 * @apiParam {String} fullName first and last names of the user as they would appear on a check.
 * @apiParam {Number} reimbursementAmount the total amount of money they are requesting, as appears on their receipts
 * @apiParam {String} mailingAddress the full postal address of the user
 * @apiParam {enum} groupMembers ["1", "2", "3", "4+"]
 * @apiParam {FILE} [receipt] The receipt files for this user, users can send up to 5 files all under fieldname receipt. (Max size: 5 MB each)
 * @apiPermission UserPermission
 * @apiSuccess {String} Success
 * @apiUse IllegalArgumentError
 */
router.post('/', upload.array('receipt', 5), (req, res, next) => {
  if (!parseInt(req.body.reimbursementAmount, 10)) {
    const error = new Error();
    error.body = { error: 'Reimbursement amount must be a number' };
    error.status = 400;
    return next(error);
  }
  req.body.reimbursementAmount = parseInt(req.body.reimbursementAmount, 10);
  if (!req.body || !validateReimbursement(req.body)) {
    const error = new Error();
    error.body = { error: 'Request body must be set and be valid' };
    error.status = 400;
    return next(error);
  }
  req.body.reimbursementAmount =
    adjustReimbursementPrice(req.body.reimbursementAmount, req.body.groupMembers);
  req.body.receiptURIs = req.files.map(({ key }) => storage.uploadedFileUrl(key))
    .join(',');
  new TravelReimbursement(Object.assign(req.body, { uid: res.locals.user.uid }))
    .add()
    .then(() => {
      res.status(200)
        .send({
          amount: req.body.reimbursementAmount,
        });
    })
    .catch(error => errorHandler500(error, next));
});

module.exports = router;
