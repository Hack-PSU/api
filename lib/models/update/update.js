"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable class-methods-use-this */
const json_asset_loader_1 = __importDefault(require("../../assets/schemas/json-asset-loader"));
const BaseObject_1 = __importDefault(require("../BaseObject"));
const liveUpdateSchema = json_asset_loader_1.default('liveUpdateSchema');
class Update extends BaseObject_1.default {
    static get useRTDB() {
        return true;
    }
    get schema() {
        return liveUpdateSchema;
    }
    get id() {
        return this.uid;
    }
    static generateTestData() {
        throw new Error('Not implemented');
    }
    constructor(data) {
        super();
        this.update_title = data.updateTitle;
        this.update_text = data.updateText;
        this.update_image = data.updateImage;
        this.update_time = data.updateTime || new Date().getTime();
        this.push_notification = data.pushNotification || false;
        this.disallowedProperties = ['useRTDB', 'push_notification', 'hackathonPromise'];
    }
}
exports.Update = Update;
//# sourceMappingURL=update.js.map