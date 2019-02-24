"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const uuid = __importStar(require("uuid"));
const json_asset_loader_1 = __importDefault(require("../../assets/schemas/json-asset-loader"));
const BaseObject_1 = __importDefault(require("../BaseObject"));
const hackathonSchema = json_asset_loader_1.default('hackathonSchema');
class Hackathon extends BaseObject_1.default {
    get id() {
        return this.uid;
    }
    get schema() {
        return hackathonSchema;
    }
    constructor(data) {
        super();
        this.uid = data.uid || uuid.v4().replace(/-/g, '');
        this.name = data.name;
        this.start_time = data.startTime || Date.now();
        this.end_time = data.endTime;
        this.base_pin = data.basePin;
        this.active = false;
    }
    merge(oldObject, newObject) {
        newObject.uid = newObject.uid || oldObject.uid;
        newObject.name = newObject.name || oldObject.name;
        newObject.start_time = Math.abs(newObject.start_time - Date.now()) < 1000 ?
            parseInt(oldObject.start_time, 10) :
            newObject.start_time;
        newObject.end_time = newObject.end_time || parseInt(oldObject.end_time, 10);
        newObject.base_pin = newObject.base_pin || oldObject.base_pin;
        newObject.active = newObject.active || oldObject.active;
        return newObject;
    }
}
exports.Hackathon = Hackathon;
//# sourceMappingURL=hackathon.js.map