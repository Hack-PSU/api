import * as firebase from 'firebase-admin';

export interface IRtdbFactory {
  getDatabase(): firebase.database.Database;
}
