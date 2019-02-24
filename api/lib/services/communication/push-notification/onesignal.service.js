"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const injection_js_1 = require("injection-js");
const request = __importStar(require("request"));
const constants_1 = require("../../../assets/constants/constants");
const CONTENT_TYPE = 'application/json; charset=utf-8';
const APP_URL = 'https://app.hackpsu.org';
const ONESIGNAL_URL = 'https://onesignal.com/api/v1/notifications';
let OnesignalService = class OnesignalService {
    constructor() {
        this.appId = constants_1.Constants.pushNotifKey.app_id;
        this.authorization = `Basic ${constants_1.Constants.pushNotifKey.key}`;
    }
    sendNotification(notificationTitle, notificationBody) {
        const headers = {
            Authorization: this.authorization,
            'Content-Type': CONTENT_TYPE,
        };
        const data = {
            app_id: this.appId,
            contents: { en: notificationBody.toString() },
            headings: { en: notificationTitle.toString() },
            included_segments: ['All'],
            url: APP_URL,
        };
        const options = {
            headers,
            json: data,
            method: 'POST',
            uri: ONESIGNAL_URL,
        };
        return new Promise((resolve, reject) => {
            request.post(options, (err, response, body) => {
                if (body && body.errors && body.errors.length > 0) {
                    reject(body.errors);
                }
                else {
                    resolve(body);
                }
            });
        });
    }
};
OnesignalService = __decorate([
    injection_js_1.Injectable(),
    __metadata("design:paramtypes", [])
], OnesignalService);
exports.OnesignalService = OnesignalService;
//# sourceMappingURL=onesignal.service.js.map