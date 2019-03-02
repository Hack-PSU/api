import * as firebase from 'firebase-admin';
import { Inject, Injectable } from 'injection-js';
import { FirebaseService } from '../../common/firebase/firebase.service';
import { IRtdbFactory } from './rtdb-factory';

@Injectable()
export class RtdbConnectionFactory implements IRtdbFactory {

  constructor(@Inject('FirebaseService') private firebaseService: FirebaseService) {
  }

  public getDatabase(): firebase.database.Database {
    return this.firebaseService.admin.database();
  }
}
