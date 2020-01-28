
// Until I can figure out how to load json modules without firebase service throwing an error, this will have to wait

// import * as firebase from 'firebase';
// import { slow, suite, test } from 'mocha-typescript';
// import squel from 'squel';
// import { Update } from '../../../src/models/update/update';
// import { RtdbQueryType } from '../../../src/services/database/svc/rtdb-uow.service';
// import { IntegrationTest } from '../integration-test';
// import { TestData } from '../test-data';

// let listener: firebase.Unsubscribe;
// let firebaseUser: firebase.User;

// function login(email: string, password: string): Promise<firebase.User> {
//   if (firebaseUser) {
//     return new Promise(resolve => resolve(firebaseUser));
//   }
//   return new Promise((resolve, reject) => {
//     firebase.auth()
//       .signInWithEmailAndPassword(email, password)
//       .catch(err => reject(err));
//     listener = firebase.auth()
//       .onAuthStateChanged((user) => {
//         if (user) {
//           firebaseUser = user;
//           resolve(user);
//         }
//       });
//   });
// }

// function loginAdmin() {
//   return login('admin@email.com', 'password');
// }

// @suite('INTEGRATION TEST: Live Update')
// class LiveUpdatesIntegrationTest extends IntegrationTest {

//   public static async before() {
//     await IntegrationTest.before();
//   }

//   public static async after() {
//     await IntegrationTest.after();
//     await firebase.auth().signOut();
//     if (listener) {
//       listener();
//     }
//   }

//   protected readonly apiEndpoint = '/v2/live/updates';
//   protected readonly tableName = 'updates';
//   protected readonly pkColumnName = 'uid';

//   @test('successfully creates a new live update')
//   @slow(1500)
//   public async createUpdateSuccessfully() {
//     // GIVEN: API
//     // WHEN: Creating a new update
//     const user = await loginAdmin();
//     const idToken = await user.getIdToken();
//     const parameters = {
//       updateTitle: 'Test title',
//       updateText: 'Test text',
//       updateImage:'https://app.hackpsu.org/assets/images/logo.svg',
//     };
//     const res = await this.chai
//       .request(this.app)
//       .post(this.apiEndpoint)
//       .set('idToken', idToken)
//       .set('content-type', 'application/json')
//       .send(parameters);
//     // THEN: Returns a well formed response
//     super.assertRequestFormat(res);
//     // THEN: The inserted update is checked
//     await this.verifyUpdate(res.body.body.data);
//   }

//   private async verifyUpdate(update: Update) {
//     const result = await LiveUpdatesIntegrationTest.rtdbUow.query<Update>(
//         RtdbQueryType.GET,
//         [`${this.tableName}/${LiveUpdatesIntegrationTest.activeHackathon.uid}/${update.uid}`],
//       );
//     this.expect(result).to.deep.equal(update);
//   }
// }
