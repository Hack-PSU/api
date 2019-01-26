/* eslint-disable max-len,no-param-reassign,consistent-return */
router.use('/checkout', checkout);

/** ********************** ROUTES ******************************** */

// /**
//  *
// // TODO: remove this route on open source version
// router.get('/rsvp_attendance', verifyACL(2), (req, res, next) => {
//   const arr = [];
//   database.getAttendanceHackedRsvpSpringMess()
//     .on('data', (document) => {
//       arr.push(document);
//     }).on('err', (err) => {
//     const error = new Error();
//     error.status = 500;
//     error.body = err.message;
//     next(error);
//   }).on('end', () => {
//     Promise.all(arr.map(value => new Promise((resolve, reject) => {
//       getUserData(value.uid)
//         .then((user) => {
//           value.sign_up_time = new Date(user.metadata.creationTime).getTime();
//           resolve(value);
//         }).catch(err => reject(err));
//     }))).then(result => res.status(200).send(result))
//       .catch((err) => {
//         res.status(207).send(arr);
//       });
//   });
// });

/**
 * @api {post} /admin/assignment Assign RFID tags ID to users
 * @apiVersion 1.0.0
 * @apiName Assign an RFID to a user (Admin)
 *
 * @apiGroup Admin
 * @apiPermission TeamMemberPermission
 *
 * @apiUse AuthArgumentRequired
 * @apiParam {Array} assignments An array of RFID tags to User uid assignments
 * @apiParamExample {json} Request-Example:
 *     [
 *      {
 *       "rfid": "1vyv2boy1v3b4oi12-1234lhb1234b",
 *       "uid": "nbG7b87NB87nB7n98Y7",
 *       "time": 1239712938120
 *     },
 *     { ... }
 *     ]
 * @apiSuccess {String} Success
 * @apiUse IllegalArgumentError
 */
router.post('/assignment', verifyACL(2), (req, res, next) => {
  const validate = ajv.compile(rfidAssignmentSchema);
  if (!req.body ||
      !req.body.assignments ||
      !validate(req.body.assignments)) {
    const error = new Error();
    error.status = 400;
    error.body = { message: 'Assignments must be provided as a valid Json Array' };
    return next(error);
  }
  // LEGAL
  database.addRfidAssignments(req.uow, req.body.assignments)
    .then((resolutions) => {
      // Handle any errors.
      const status = resolutions.filter(resolve => resolve).length === 0 ? 200 : 207;
      res.status(status).send(resolutions.map((resolve, index) => {
        delete req.body.assignments[index].hackathon;
        if (resolve) {
          if (resolve.errno === 1452) {
            // Foreign Key Failed. Probably an invalid user id, location, or hackathon.
            return new HttpError({ message: 'Invalid data', scan: req.body.assignments[index] }, 400);
          }
          if (resolve.errno === 1062) {
            // Duplicate data detected
            return new HttpError({ message: 'Duplicates detected', scan: req.body.assignments[index] }, 409);
          }
          return new HttpError({ message: 'Something went wrong detected', scan: req.body.assignments[index] }, 500);
        }
        return req.body.assignments[index];
      }));
    })
    .catch(err => errorHandler500(err, next));
});

/**
 * @api {post} /admin/extra_credit setting user with the class they are receiving extra credit
 * @apiName Assign Extra Credit
 * @apiVersion 1.0.0
 * @apiGroup Extra Credit
 * @apiPermission DirectorPermission
 *
 * @apiParam {String} uid - the id associated with the student
 * @apiParam {String} cid - the id associated with the class
 * @apiUse AuthArgumentRequired
 * @apiSuccess {String} Success
 * @apiUse IllegalArgumentError
 */
router.post(['/assign_extra_credit', '/extra_credit'], verifyACL(3), (req, res, next) => {
  if (!req.body ||
      !req.body.uid ||
      !req.body.cid ||
      !parseInt(req.body.cid, 10)) {
    const error = new Error();
    error.status = 400;
    error.body = 'Need a proper id for the class or the hacker (int)';
    return next(error);
  }
  database.assignExtraCredit(req.uow, req.body.uid, req.body.cid)
    .then(() => {
      res.status(200)
        .send({ status: 'Success' });
    })
    .catch(err => errorHandler500(err, next));
});


module.exports = router;
