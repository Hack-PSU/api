const fs = require('fs');
const _ = require('lodash');

function readJsonFile(filename) {
  const filePath = `${__dirname}/${filename}`;
  if (!fs.existsSync(filePath)) {
    throw new Error('Invalid schema requested.');
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

/**
 *
 * @param name {String | Array} Schema(s) to load
 * @returns {Object}
 */
module.exports = (name) => {
  if (Array.isArray(name)) {
    return _.zipObject(name, name.map((schemaName) => {
      const fileName = `${schemaName}.json`;
      return readJsonFile(fileName);
    }));
  }
  return readJsonFile(`${name}.json`);
};
