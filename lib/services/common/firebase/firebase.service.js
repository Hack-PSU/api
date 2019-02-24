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
const firebase = __importStar(require("firebase-admin"));
const constants_1 = require("../../../assets/constants/constants");
// @ts-ignore
const config_json_1 = __importDefault(require("../../../config.json"));
const util_1 = require("../../../JSCommon/util");
/**
 * Singleton class
 */
class FirebaseService {
    static get instance() {
        if (!this._instance) {
            this._instance = new FirebaseService();
        }
        return this._instance;
    }
    get admin() {
        return this._admin;
    }
    constructor() {
        let databaseURL;
        switch (util_1.Util.getCurrentEnv()) {
            case util_1.Environment.PRODUCTION:
                databaseURL = constants_1.Constants.firebaseDB.prod;
                break;
            case util_1.Environment.TEST:
                databaseURL = constants_1.Constants.firebaseDB.test;
                break;
            case util_1.Environment.STAGING:
                databaseURL = constants_1.Constants.firebaseDB.debug;
                break;
            case util_1.Environment.DEBUG:
                databaseURL = constants_1.Constants.firebaseDB.debug;
                break;
            default:
                throw new Error('Illegal environment type. Could not instantiate Firebase database');
        }
        this._admin = firebase.initializeApp({
            credential: firebase.credential.cert({
                clientEmail: config_json_1.default.client_email,
                privateKey: config_json_1.default.private_key,
                projectId: config_json_1.default.project_id,
            }),
            databaseURL,
        });
    }
}
exports.FirebaseService = FirebaseService;
//# sourceMappingURL=firebase.service.js.map