"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable class-methods-use-this */
const json_asset_loader_1 = __importDefault(require("../../assets/schemas/json-asset-loader"));
const BaseObject_1 = __importDefault(require("../BaseObject"));
const categorySchema = json_asset_loader_1.default('categorySchema');
exports.TABLE_NAME = 'CATEGORY_LIST';
class Category extends BaseObject_1.default {
    get schema() {
        return categorySchema;
    }
    get id() {
        return this.uid;
    }
    constructor(data) {
        super();
        this.uid = data.uid;
        this.categoryName = data.categoryName;
        this.isSponsor = data.isSponsor;
    }
}
exports.Category = Category;
//# sourceMappingURL=category.js.map