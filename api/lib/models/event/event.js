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
const eventSchema = json_asset_loader_1.default('eventSchema');
var EventType;
(function (EventType) {
    EventType["WORKSHOP"] = "workshop";
    EventType["ACTIVITY"] = "activity";
    EventType["FOOD"] = "food";
})(EventType = exports.EventType || (exports.EventType = {}));
class Event extends BaseObject_1.default {
    get schema() {
        return eventSchema;
    }
    get id() {
        return this.uid;
    }
    constructor(data) {
        super();
        this.uid = data.uid || uuid.v4().replace(/-/g, '');
        this.event_location = data.eventLocation;
        this.event_start_time = data.eventStartTime;
        this.event_end_time = data.eventEndTime;
        this.event_title = data.eventTitle;
        this.event_description = data.eventDescription || null;
        this.event_type = data.eventType;
    }
}
exports.Event = Event;
//# sourceMappingURL=event.js.map