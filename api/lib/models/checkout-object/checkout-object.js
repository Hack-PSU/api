"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable class-methods-use-this */
const json_asset_loader_1 = __importDefault(require("../../assets/schemas/json-asset-loader"));
const BaseObject_1 = __importDefault(require("../BaseObject"));
const checkoutObjectSchema = json_asset_loader_1.default('checkoutObjectSchema');
exports.TABLE_NAME = 'CHECKOUT_DATA';
class CheckoutObject extends BaseObject_1.default {
    get schema() {
        return checkoutObjectSchema;
    }
    get id() {
        return this.uid;
    }
    constructor(data) {
        super();
        this.item_id = data.item_id;
        this.user_id = data.user_id;
        this.checkout_time = data.checkout_time;
        this.return_time = data.return_time;
        this.hackathon = data.hackathon;
    }
}
exports.CheckoutObject = CheckoutObject;
//# sourceMappingURL=checkout-object.js.map