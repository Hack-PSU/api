#!/usr/bin/env node
const firebase = require('firebase');
firebase.initializeApp({
    apiKey: "AIzaSyAWejnwBUrfUoULnMRumGFpOchYjjHlfTI",
    authDomain: "hackpsu18-staging.firebaseapp.com",
    databaseURL: "https://hackpsu18-staging.firebaseio.com",
    projectId: "hackpsu18-staging",
    storageBucket: "hackpsu18-staging.appspot.com",
    messagingSenderId: "614592542726"
});
firebase.auth().signInWithEmailAndPassword(process.argv[2], process.argv[3])
    .then((user) => {
        user.getIdToken(true)
            .then((idtoken) => {
                console.log(idtoken);
                process.exit();
            })
            .catch(err => console.error(err));

    }).catch(err => console.error(err));
