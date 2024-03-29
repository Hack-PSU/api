process.env.APP_ENV = 'test';
process.env.TS_NODE_FILES = 'true';
import * as dotenv from 'dotenv';
dotenv.config();

import chai from 'chai';
import chaiHttp from 'chai-http';
import express from 'express';
import * as firebase from 'firebase';
import * as squel from 'squel';
import * as request from 'superagent';
import v4 from 'uuid/v4';
import app from '../../lib/app';
import { Constants } from '../../src/assets/constants/constants';
import { ActiveHackathon } from '../../src/models/hackathon/active-hackathon/active-hackathon';
import { MemCacheServiceImpl } from '../../src/services/database/cache/memcache-impl.service';
import { SqlConnectionFactory } from '../../src/services/database/connection/sql-connection-factory';
import { MysqlUow } from '../../src/services/database/svc/mysql-uow.service';
import { Logger } from '../../src/services/logging/logging';
import { TestData } from './test-data';

// Just to make sure
Constants.sqlConnection.database = 'travis';

let initialized = false;
const config = {
  apiKey: 'AIzaSyAWejnwBUrfUoULnMRumGFpOchYjjHlfTI',
  authDomain: 'hackpsu18-staging.firebaseapp.com',
  databaseURL: 'https://hackpsu18-staging.firebaseio.com',
  projectId: 'hackpsu18-staging',
  storageBucket: 'hackpsu18-staging.appspot.com',
  messagingSenderId: '614592542726',
};

function firebaseInitializer() {
  if (initialized) {
    return;
  }
  firebase.initializeApp(config);
  initialized = true;
}

export abstract class IntegrationTest {

  public static async before() {
    if (!this.activeHackathon) {
      this.activeHackathon = new ActiveHackathon({
        basePin: 0,
        name: 'test',
        startTime: Date.now(),
        endTime: null,
        uid: v4(),
      });
    }

    const query = squel.insert()
      .into('HACKATHON')
      .setFieldsRows([this.activeHackathon.dbRepresentation])
      .toParam();
    query.text = query.text.concat(';');

    await this.mysqlUow.query(query.text, query.values);
    await TestData.setup();
  }

  public static async after() {
    await TestData.tearDown();
    const query = squel.delete()
      .from('HACKATHON')
      .toParam();
    query.text = query.text.concat(';');
    await this.mysqlUow.query(query.text, query.values);
    await this.firebaseLogout();
  }

  private static memcache = new MemCacheServiceImpl();
  private static adminUser: boolean;
  protected abstract apiEndpoint: string;
  // tslint:disable:member-ordering
  public static activeHackathon: ActiveHackathon;
  public static listener: firebase.Unsubscribe;
  public static firebaseUser: firebase.User;
  public static mysqlUow = new MysqlUow(
    new SqlConnectionFactory(),
    IntegrationTest.memcache,
    new Logger(),
  );
  protected expect: Chai.ExpectStatic;
  protected chai: Chai.ChaiStatic;
  protected app: express.Application;

  protected constructor() {
    IntegrationTest.memcache.setGlobalCacheFlag(false);

    chai.use(chaiHttp);
    this.expect = chai.expect;
    this.chai = chai;
    this.app = app;
    firebaseInitializer();
  }

  protected assertRequestFormat(
    res: request.Response,
    api_response: string = 'Success',
    status: number = 200,
    bodyResult: string = 'Success',
    bodyExpected: boolean = true,
  ) {
    this.expect(res).status(status);
    this.expect(res).header('content-type', 'application/json; charset=utf-8');
    this.expect(res.body).to.deep.include({
      api_response: api_response,
      status: status,
    });
    if (bodyExpected) {
      this.expect(res.body.body).to.deep.include({
        result: bodyResult,
      });
    }
  }

  protected static async login(email: string, password: string): Promise<firebase.User> {
    await this.firebaseLogout();
    return new Promise((resolve, reject) => {
      firebase.auth()
        .signInWithEmailAndPassword(email, password)
        .catch(err => reject(err));
      this.listener = firebase.auth()
        .onAuthStateChanged((user) => {
          if (user) {
            this.firebaseUser = user;
            resolve(user);
          }
        });
    });
  }

  protected static loginAdmin(): Promise<firebase.User> {
    if (this.firebaseUser && this.adminUser) {
      return new Promise(resolve => resolve(this.firebaseUser));
    }
    this.adminUser = true;
    return this.login('admin@email.com', 'password');
  }

  protected static loginRegular(): Promise<firebase.User> {
    if (this.firebaseUser && !this.adminUser) {
      return new Promise(resolve => resolve(this.firebaseUser));
    }
    this.adminUser = false;
    return this.login('prevhacker@email.com', 'password');
  }

  protected static async firebaseLogout() {
    await firebase.auth().signOut();
    if (this.listener) {
      this.listener();
    }
  }
}
