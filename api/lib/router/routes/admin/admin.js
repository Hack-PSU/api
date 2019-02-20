/* eslint-disable max-len,no-param-reassign,consistent-return */
// router.use('/checkout', checkout);

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
