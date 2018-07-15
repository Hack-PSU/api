const firebase = require('firebase');
const admin = require('firebase-admin');
const serviceAccount = require('../config.json');

let initialized = false;
// Initialize Firebase
const config = {
  apiKey: 'AIzaSyCpvAPdiIcqKV_NTyt6DZgDUNyjmA6kwzU',
  authDomain: 'hackpsu18.firebaseapp.com',
  databaseURL: 'https://hackpsu18-test.firebaseio.com',
  projectId: 'hackpsu18',
  storageBucket: 'hackpsu18.appspot.com',
  messagingSenderId: '1002677206617',
};

module.exports = () => {
  if (initialized) {
    return;
  }
  firebase.initializeApp(config);
  initialized = true;
};
