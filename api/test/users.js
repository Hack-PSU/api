const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../app');
const sql = require("mysql");
const firebase = require("firebase");
const Chance = require('chance');
const chance = new Chance(123);

const sqlOptions = require('../assets/helpers/constants').sqlConnection;
const connection = sql.createConnection(sqlOptions);

connection.connect((err) => {
    if (err) {
        console.error(err);
    }
});

const should = chai.should();

chai.use(chaiHttp);


let listener = null;

/**
 *
 * @param email
 * @param password
 * @return {Promise<firebase.User>}
 */
function login(email, password) {
    return new Promise((resolve, reject) => {
        firebase.auth().signInWithEmailAndPassword(email, password).catch(err => reject(err));
        listener = firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                resolve(user);
            }
        });
    });
}

/**
 *
 * @return {Promise<firebase.User>}
 */
function loginRegular() {
    return login('test@email.com', 'password');
}

/**
 *
 * @return {{firstName, lastName: *, email, gender: string, shirtSize: string, dietaryRestriction: string, university: string, travelReimbursement: boolean, firstHackathon: boolean, academicYear: string, major: string, phone: *|{type, minLength, maxLength}, ethnicity: string, codingExperience: string, eighteenBeforeEvent: boolean, mlhcoc: boolean, mlhdcp: boolean, uid: string, referral: string, project: *, expectations: *, veteran: boolean}}
 */
function generateGoodRegistration() {
    return {
        firstName: chance.first(),
        lastName: chance.last(),
        email: chance.email(),
        gender: chance.gender().toLowerCase(),
        shirtSize: "M",
        dietaryRestriction: "vegetarian",
        university: "Georgetown University",
        travelReimbursement: false,
        firstHackathon: true,
        academicYear: 'freshman',
        major: 'Visual aesthetics',
        phone: chance.phone(),
        ethnicity: 'caucasian',
        codingExperience: 'beginner',
        eighteenBeforeEvent: true,
        mlhcoc: true,
        mlhdcp: true,
        uid: 'WaPm1vcEVvaw0tbCbrBHs2e891s2',
        referral: "Facebook",
        project: chance.sentence(),
        expectations: chance.sentence(),
        veteran: true
    }
}

describe('get registration', () => {
    let idToken = null;
    let generatedRegistration = null;
    // Create the registration if it does not exist
    before((done) => {
        generatedRegistration = generateGoodRegistration();
        loginRegular()
            .then((user) => {
                user.getIdToken(true)
                    .then((decodedIdToken) => {
                        idToken = decodedIdToken;
                        chai.request(server)
                            .post('/v1/register')
                            .set('idtoken', idToken)
                            .type('form')
                            .send(generatedRegistration)
                            .end((err, res) => {
                                done();
                            });
                    }).catch(err => done(err));
            }).catch(err => done(err));
    });

    describe('failure', () => {
        it ('it should respond with an unauthorized message', (done) => {
            chai.request(server)
                .get('/v1/users/registration')
                .end((err, res) => {
                    res.should.have.status(401);
                    should.equal(err.response.body.error, 'ID Token must be provided');
                    done();
            });
        });
    });

    describe('success', () => {
        it ('it should return the user information', (done) => {
            chai.request(server)
                .get('/v1/users/registration')
                .set('idtoken', idToken)
                .end((err, res) => {
                    should.equal(err, null);
                    res.body.should.be.a('object');
                    done();
                });
        })
    });

    after((done) => {
        firebase.auth().signOut();
        done();
    });
});