const { Readable } = require('stream');

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
    console.debug(query, reference, data);
    this.db.goOnline();
    return new Promise((resolve, reject) => {
      switch (query) {
        case RtdbUow.queries.GET:
          this.db.ref(reference)
            .once('value', (d) => {
              const firebaseData = d.val();
              const stream = new Readable({ objectMode: true });
              resolve(stream);
              if (firebaseData) {
                const returnArr = Object.keys(firebaseData).map((i) => {
                  const obj = {};
                  obj[i] = firebaseData.val()[i];
                  return obj;
                });
                stream.push(returnArr);
              }
              stream.push(null);
            }).catch(reject);
          break;

        case RtdbUow.queries.SET:
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
          break;
        case RtdbUow.queries.REF:
          resolve(this.db.ref(reference).toString());
          break;

        default:
          reject(new Error('Illegal query'));
          break;
      }
    });
  }
};

