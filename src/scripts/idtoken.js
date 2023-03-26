#!/usr/bin/env node
/* eslint-disable no-console */
const firebase = require('firebase');

// firebase.initializeApp({
//   apiKey: 'AIzaSyAWejnwBUrfUoULnMRumGFpOchYjjHlfTI',
//   authDomain: 'hackpsu18-staging.firebaseapp.com',
//   databaseURL: 'https://hackpsu18-staging.firebaseio.com',
//   projectId: 'hackpsu18-staging',
//   storageBucket: 'hackpsu18-staging.appspot.com',
//   messagingSenderId: '614592542726',
// });
firebase.initializeApp({
  apiKey: 'AIzaSyCpvAPdiIcqKV_NTyt6DZgDUNyjmA6kwzU',
  authDomain: 'hackpsu18.firebaseapp.com',
  databaseURL: 'https://hackpsu18.firebaseio.com',
  projectId: 'hackpsu18',
  storageBucket: 'hackpsu18.appspot.com',
  messagingSenderId: '1002677206617',
});
firebase.auth().signInWithEmailAndPassword(process.argv[2], process.argv[3])
  .then(() => {
    firebase.auth().currentUser.getIdToken(true)
      .then((idtoken) => {
        console.log(idtoken);
        process.exit();
      })
      .catch(err => console.error(err));
  }).catch(err => console.error(err));
