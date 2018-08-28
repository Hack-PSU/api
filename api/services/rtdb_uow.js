/* eslint-disable class-methods-use-this,no-underscore-dangle */
const streamable = require('stream-array');
const _ = require('lodash');

module.exports = class RtdbUow {
  /**
   *
   * @param database {firebase.database}
   */
  constructor(database) {
    this.db = database;
  }

  static get queries() {
    return Object.freeze({
      GET: 0,
      SET: 1,
      UPDATE: 2,
      REF: 3,
      COUNT: 4,
    });
  }

  /**
   *
   * @param query {enum} GET, SET, REF
   * @param reference {String} A reference in the database
   * @param [data] {Object} Data if query is SET
   * @returns {Promise<DataSnapshot>}
   */
  query(query, reference, data) {
    if (process.env.APP_ENV === 'debug') {
      console.debug(query, reference, data);
    }
    this.db.goOnline();
    switch (query) {
      case RtdbUow.queries.GET:
        return this._get(reference);
      case RtdbUow.queries.SET:
        return this._set(data, reference);
      case RtdbUow.queries.REF:
        return Promise.resolve(this.db.ref(reference)
          .toString());
      case RtdbUow.queries.COUNT:
        return this._count(reference);
      case RtdbUow.queries.UPDATE:
        return this._set(data, reference);
      default:
        return Promise.reject(new Error('Illegal query'));
    }
  }

  _get(reference) {
    return new Promise((resolve, reject) => {
      this.db.ref(reference)
        .once('value', (data) => {
          const firebaseData = data.val();
          let result = [];
          if (firebaseData) {
            result = Object
              .entries(firebaseData)
              .map((pair) => {
                const r = {};
                [, r[pair[0]]] = pair;
                return r;
              });
          }
          resolve(new streamable(result));
        })
        .catch(reject);
    });
  }

  _count(reference) {
    return new Promise((resolve) => {
      let count = 0;
      this.db.ref(reference)
        .on('child_added', () => {
          count += 1;
        });
      this.db.ref(reference)
        .once('value', () => {
          resolve(count);
        });
    });
  }

  complete() {
    return Promise.resolve();
  }

  _set(data, reference) {
    return new Promise((resolve, reject) => {
      if (!data) {
        reject(new Error('opts.data must be provided'));
        return;
      }
      this.db.ref(reference)
        .transaction(() => data, (error, committed, snapshot) => {
          if (error) {
            reject(error);
          } else {
            const returnObject = {};
            returnObject[snapshot.key] = snapshot.val();
            resolve(returnObject);
          }
        }, true)
        .catch(reject);
    });
  }
};

