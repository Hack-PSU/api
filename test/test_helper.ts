process.env.APP_ENV = 'test';
process.env.TS_NODE_FILES = 'true';
import chai from 'chai';
import chaiHttp from 'chai-http';
import firebase from 'firebase';
import 'mocha';
import app from '../src/app';

chai.use(chaiHttp);
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

export function testHelper() {
  if (initialized) {
    return;
  }
  firebase.initializeApp(config);
  initialized = true;
}

export { chai, app };
