"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable class-methods-use-this */
const json_asset_loader_1 = __importDefault(require("../../assets/schemas/json-asset-loader"));
const BaseObject_1 = __importDefault(require("../BaseObject"));
const checkoutItemsSchema = json_asset_loader_1.default('checkoutItemSchema');
exports.TABLE_NAME = 'CHECKOUT_ITEMS';
class CheckoutItems extends BaseObject_1.default {
    get schema() {
        return checkoutItemsSchema;
    }
    get id() {
        return this.uid;
    }
    constructor(data) {
        super();
        this.name = data.name;
        this.quantity = data.quantity;
    }
}
exports.CheckoutItems = CheckoutItems;
//# sourceMappingURL=checkout-items.js.map