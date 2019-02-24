"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const _ = __importStar(require("lodash"));
/**
 * IMPORTANT: YOU SHOULD NOT HAVE TO CHANGE THIS FILE TO ADD A NEW SCHEMA!
 * SIMPLY ADD A NEW SCHEMA JSON FILE TO THIS DIRECTORY, AND YOU SHOULD
 * BE ABLE TO LOAD THE SCHEMAS DIRECTLY.
 */
/**
 * Simple synchronous JSON parser.
 * @param filename
 * @returns {any}
 */
function readJsonFile(filename) {
    const filePath = `${__dirname}/${filename}`;
    if (!fs.existsSync(filePath)) {
        throw new Error('Invalid schema requested.');
    }
    return require(filePath);
}
/**
 * This exported function will load a schema directly from the
 * file system and return the schema object to the caller.
 * This function also accepts an array of schemas to load
 * and will return all the schemas as sub-objects.
 * @param name {String | Array} Schema(s) to load
 * @returns {Object}
 */
exports.default = (name) => {
    if (Array.isArray(name)) {
        return _.zipObject(name, name.map((schemaName) => {
            const fileName = `${schemaName}.json`;
            return readJsonFile(fileName);
        }));
    }
    return readJsonFile(`${name}.json`);
};
//# sourceMappingURL=json-asset-loader.js.map