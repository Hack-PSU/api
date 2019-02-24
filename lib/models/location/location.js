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
const locationSchema = json_asset_loader_1.default('locationSchema');
class Location extends BaseObject_1.default {
    get schema() {
        return locationSchema;
    }
    get id() {
        return this.uid;
    }
    constructor(data) {
        super();
        this.uid = data.uid || uuid.v4().replace(/-/g, '');
        this.location_name = data.locationName;
    }
}
exports.Location = Location;
//# sourceMappingURL=location.js.map