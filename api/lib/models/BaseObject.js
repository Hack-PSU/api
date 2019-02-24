"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-underscore-dangle,no-param-reassign,class-methods-use-this */
const ajv_1 = __importDefault(require("ajv"));
const lodash_1 = __importDefault(require("lodash"));
const ajvValidator = new ajv_1.default();
/**
 * @class BaseObject
 * The base object definition for any table in the database
 */
class BaseObject {
    /**
     * Returns a representation of the object that can be added directly to the database
     * For any subclass that contains properties that do not get added to the db,
     * ensure that this method is overridden and calls super.dbRepresentation()
     * @return {Object}
     * @private
     */
    get dbRepresentation() {
        return lodash_1.default(this)
            .omit(Array.from(this.disallowedPropertiesInternal.values()))
            .omitBy(lodash_1.default.isNil)
            .value();
    }
    /**
     * This function strips the object of any internal properties
     * Specifically, it removes the disallowedProperties Set, but in case there
     * are any other fields in subclasses that should not be present in an instance
     * of the object sent for APIs, override this method and delete those there
     */
    get cleanRepresentation() {
        const clone = Object.assign({}, this);
        // @ts-ignore
        delete clone.disallowedPropertiesInternal;
        return clone;
    }
    /**
     * Returns the current disallowed properties for the object
     * @returns {string[]}
     */
    get disallowedProperties() {
        return Array.from(this.disallowedPropertiesInternal);
    }
    /**
     * Set any properties that should not be included in the database representation
     * @param {string[]} arr
     */
    set disallowedProperties(arr) {
        arr.forEach(val => this.disallowedPropertiesInternal.add(val));
    }
    constructor() {
        this.disallowedPropertiesInternal = new Set();
        this.disallowedProperties = ['disallowedPropertiesInternal'];
    }
    merge(newObject, oldObject) {
        return lodash_1.default.merge(Object.create(this), oldObject, newObject);
    }
    /**
     * Validates that the object matches some ajv schema
     * @return {result: boolean, error: string}
     */
    validate() {
        if (this.schema) {
            const validate = ajvValidator.compile(this.schema);
            const result = validate(this);
            return {
                error: result ?
                    undefined :
                    ajvValidator.errorsText(validate.errors),
                result,
            };
        }
        return { result: true, error: undefined };
    }
}
exports.default = BaseObject;
//# sourceMappingURL=BaseObject.js.map