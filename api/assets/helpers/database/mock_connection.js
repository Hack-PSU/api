module.exports = class MockConnection {

  beginTransaction() {
    console.log('Starting transaction');
  }

  rollback() {
    console.error('Rolling back');
  }

  query(query, params) {
    console.log(`Query: ${query}\n Params: ${params}`);
    return process.stdout;
  }

  commit() {
    console.log('Committing');
  }

  release() {
    console.log('Connection released');
  }


}