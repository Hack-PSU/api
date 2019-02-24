"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hackathon_1 = require("../hackathon");
class ActiveHackathon extends hackathon_1.Hackathon {
    constructor(data) {
        super(data);
        this.active = true;
    }
}
exports.ActiveHackathon = ActiveHackathon;
//# sourceMappingURL=active-hackathon.js.map