/* eslint-disable no-undef */
process.env.NODE_ENV = 'test';
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../app');
const sql = require("mysql");
const squel = require("squel");
const sqlOptions = require('../helpers/constants').sqlConnection;
const connection = sql.createConnection(sqlOptions);

const should = chai.should();

chai.use(chaiHttp);

describe.skip('pre-registration tests', () => {
    // Scrub DB
    before((done) => {
        const query = squel.delete({autoQuoteTableNames: true, autoQuoteFieldNames: true})
            .from("PRE_REGISTRATION_TEST")
            .toString()
            .concat(';');
        connection.query(query, (err, response, fields) => {
            if (err) {
                done(err);
            }
            done();
        });
    });


    it('it should respond with success', (done) => {
        const succMatrix = ['abc@xyz.com', 'myname@email.com', 'a@b.com'];
        const promises = [];
        succMatrix.forEach((email) => {
            promises.push(new Promise((resolve) => {
                chai.request(server)
                    .post('/v1/register/pre')
                    .type('form')
                    .send({
                        email,
                    })
                    .end((err, res) => {
                        should.equal(err, null);
                        res.should.have.status(200);
                        resolve();
                    });
            }));
        });
        Promise.all(promises).then(() => {
            done();
        }).catch((err) => {
            done(err);
        });
    });


    it('should error out each time', (done) => {
        const failMatrix = ['', 'jadlksfjalskdjf', 'j'];
        const promises = [];
        failMatrix.forEach((email) => {
            promises.push(new Promise((resolve) => {
                chai.request(server)
                    .post('/v1/register/pre')
                    .type('form')
                    .send({
                        email,
                    })
                    .end((err, res) => {
                        res.should.have.status(400);
                        resolve();
                    });
            }));
        });
        Promise.all(promises).then(() => {
            done();
        }).catch((err) => {
            console.error(err);
        });
    });
    after((done) => {
        connection.destroy();
        done();
    })
});

