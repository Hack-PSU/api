import * as firebase from 'firebase-admin';

export interface IFirebaseService {
  admin: firebase.app.App;
}
