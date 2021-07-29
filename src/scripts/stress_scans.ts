#!/usr/bin/env node
import axios from 'axios';
import * as firebase from 'firebase';
import v4 from 'uuid/v4';

firebase.initializeApp({
  apiKey: 'AIzaSyAWejnwBUrfUoULnMRumGFpOchYjjHlfTI',
  authDomain: 'hackpsu18-staging.firebaseapp.com',
  databaseURL: 'https://hackpsu18-staging.firebaseio.com',
  projectId: 'hackpsu18-staging',
  storageBucket: 'hackpsu18-staging.appspot.com',
  messagingSenderId: '614592542726',
});
const baseUrl = 'https://hackpsu18-staging.appspot.com/v2/';

export async function main() {
  // Login
  const idToken = await signInAndGetIdToken('admin@email.com', 'password');
  // tslint:disable
  console.log(idToken);
  // Download all the registrations
  const registrations = await getRegistrations(idToken);
  // For each registration, add a band
  const result = await assignBands(registrations, idToken);
  // tslint:disable
  console.log(result);
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function assignBands(registrations: Array<{ uid: string }>, idToken: string) {
  const promises: Array<Promise<any>> = [];
  for (let i = 0; i < registrations.length; i += 1) {
    await sleep(10);
    console.log(`Assigning band to: ${registrations[i].uid}`);
    promises.push(assignBand(registrations[i], idToken));
  }
  return Promise.all(promises);
}

async function assignBand(registration: { uid: string }, idToken: string) {
  const url = 'scanner/assign';
  try {
    const { data } = await axios.post(
    `${baseUrl}${url}`,
      {
        assignments: [
          {
            wid: v4(),
            uid: registration.uid,
            time: Date.now(),
          },
        ],
      },
      {
        headers: {
          idtoken: idToken,
        },
      },
  );
    return data.body.data;
  } catch (error) {
    return Promise.resolve(error);
  }
}

async function getRegistrations(idToken: string) {
  const url = 'scanner/registrations';
  const { data } = await axios.get(`${baseUrl}${url}`, {
    headers: {
      idtoken: idToken,
    },
    params: {
      allHackathons: false,
    },
  });
  return data.body.data;
}

async function signInAndGetIdToken(email: string, password: string) {
  const user = await firebase.auth().signInWithEmailAndPassword(email, password);
  return firebase.auth().currentUser!.getIdToken(true);
}
require('make-runnable');
