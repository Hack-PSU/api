const firebase = require('firebase');
const admin = require('firebase-admin');
const serviceAccount = require('../lib/config.json');

let initialized = false;
// Initialize Firebase
const config = {
  apiKey: 'AIzaSyAWejnwBUrfUoULnMRumGFpOchYjjHlfTI',
  authDomain: 'hackpsu18-staging.firebaseapp.com',
  databaseURL: 'https://hackpsu18-staging.firebaseio.com',
  projectId: 'hackpsu18-staging',
  storageBucket: 'hackpsu18-staging.appspot.com',
  messagingSenderId: '614592542726',
};

module.exports = () => {
  if (initialized) {
    return;
  }
  firebase.initializeApp(config);
  initialized = true;
};
