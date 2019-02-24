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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var ScannerProcessor_1;
const injection_js_1 = require("injection-js");
const moment_1 = __importDefault(require("moment"));
const errors_1 = require("../JSCommon/errors");
const rfid_assignment_1 = require("../models/scanner/rfid-assignment");
const router_types_1 = require("../router/router-types");
let ScannerProcessor = ScannerProcessor_1 = class ScannerProcessor {
    constructor(scannerDataMapper, scannerAuthService, eventDataMapper) {
        this.scannerDataMapper = scannerDataMapper;
        this.scannerAuthService = scannerAuthService;
        this.eventDataMapper = eventDataMapper;
        this.searchAmount = 15;
        this.searchUnits = ['minutes', 'hours', 'days', 'weeks', 'months', 'years'];
    }
    static relevantEventsFilter(value, amount, unit) {
        return moment_1.default()
            .isBetween(moment_1.default.unix(value.event_start_time / 1000).subtract(amount, unit), moment_1.default.unix(value.event_end_time / 1000).add(amount, unit));
    }
    static unitsStepFunction(int) {
        if (int < 0) {
            throw new Error('Illegal value');
        }
        if (int < 5) {
            return 0;
        }
        if (int < 10) {
            return 1;
        }
        if (int < 15) {
            return 2;
        }
        if (int < 20) {
            return 3;
        }
        if (int < 25) {
            return 4;
        }
        return 5;
    }
    processRfidAssignments(inputAssignments) {
        return __awaiter(this, void 0, void 0, function* () {
            let response;
            if (Array.isArray(inputAssignments)) {
                const assignments = inputAssignments.map(assignment => new rfid_assignment_1.RfidAssignment(assignment));
                const result = yield this.scannerDataMapper
                    .addRfidAssignments(assignments);
                // Find response status to send
                const status = Math.max(...result.data.map((individualResult) => {
                    switch (individualResult.result) {
                        case 'Error':
                            return 500;
                        case 'Duplicate detected':
                            return 409;
                        case 'Bad input':
                            return 400;
                        default:
                            return 200;
                    }
                }));
                response = new router_types_1.ResponseBody('Success', status, result);
            }
            else {
                const assignment = new rfid_assignment_1.RfidAssignment(inputAssignments);
                const result = yield this.scannerDataMapper.insert(assignment);
                response = new router_types_1.ResponseBody('Success', 200, result);
            }
            return response;
        });
    }
    processorScannerConfirmation(pin, macAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.scannerAuthService.checkPinAuthentication(pin);
            if (!result) {
                throw new errors_1.HttpError('invalid authentication pin provided', 401);
            }
            const apiToken = yield this.scannerAuthService.generateApiKey(macAddress);
            return new router_types_1.ResponseBody('Success', 200, { result: 'Success', data: apiToken });
        });
    }
    getRelevantEvents() {
        return __awaiter(this, void 0, void 0, function* () {
            const { data } = yield this.eventDataMapper.getAll({ byHackathon: true });
            const relevantEvents = this.searchForRelevantEvents(data)
                .sort((a, b) => a.event_start_time < b.event_start_time ? -1 :
                a.event_start_time === b.event_start_time ? 0 : -1);
            return new router_types_1.ResponseBody('Success', 200, { data: relevantEvents, result: 'Success' });
        });
    }
    searchForRelevantEvents(data) {
        let result;
        let lastUnit = this.searchUnits[0];
        for (let i = 0; true; i += 1) {
            if (lastUnit !== this.searchUnits[ScannerProcessor_1.unitsStepFunction(i)]) {
                this.searchAmount = 1;
            }
            lastUnit = this.searchUnits[ScannerProcessor_1.unitsStepFunction(i)];
            result = data.filter(value => ScannerProcessor_1.relevantEventsFilter(value, this.searchAmount, this.searchUnits[ScannerProcessor_1.unitsStepFunction(i)]));
            this.searchAmount += 2 + i;
            if (result.length > 0) {
                this.searchAmount = 15;
                return result;
            }
        }
    }
};
ScannerProcessor = ScannerProcessor_1 = __decorate([
    injection_js_1.Injectable(),
    __param(0, injection_js_1.Inject('IScannerDataMapper')),
    __param(1, injection_js_1.Inject('IScannerAuthService')),
    __param(2, injection_js_1.Inject('IEventDataMapper')),
    __metadata("design:paramtypes", [Object, Object, Object])
], ScannerProcessor);
exports.ScannerProcessor = ScannerProcessor;
//# sourceMappingURL=scanner-processor.js.map