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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const injection_js_1 = require("injection-js");
const multer_1 = __importDefault(require("multer"));
require("reflect-metadata");
const gcs_storage_engine_1 = require("../engines/gcs-storage.engine");
const MAX_FILENUM = 20;
let GoogleStorageService = class GoogleStorageService {
    constructor() {
        this.setFileFilter();
        this.setReadMultipleFiles();
    }
    get upload() {
        return this._upload;
    }
    setGcsOpts(gcsOptions) {
        this.bucket = gcsOptions.bucket;
        this.googleStorageEngine = new gcs_storage_engine_1.GcsStorageEngine(gcsOptions);
        return this;
    }
    setFieldName(fieldName) {
        this.fieldName = fieldName;
        return this;
    }
    setFileFilter(fileFilter = () => true) {
        this.fileFilter = fileFilter;
        return this;
    }
    setReadMultipleFiles(readMultipleFiles = false) {
        this.readMultipleFiles = readMultipleFiles;
        return this;
    }
    setBucket(bucket) {
        this.bucket = bucket;
        return this;
    }
    setFileLimits(fileLimits) {
        this.fileLimits = fileLimits;
        return this;
    }
    uploadedFileUrl(name) {
        return encodeURI(`https://${this.bucket}.storage.googleapis.com/${name}`);
    }
    /**
     * @VisibleForTesting
     */
    _fileFilter(req, file, callback) {
        try {
            const result = this.fileFilter(file);
            callback(null, result);
        }
        catch (error) {
            callback(error, false);
        }
    }
    _upload(req, res, next) {
        const limits = {
            fileSize: 1024 * 1024 * 10,
        };
        const opts = {
            fileFilter: this._fileFilter,
            limits,
            storage: this.googleStorageEngine,
        };
        const uploader = multer_1.default(opts);
        if (this.readMultipleFiles) {
            return uploader.array(this.fieldName, this.fileLimits.maxNumFiles || MAX_FILENUM)(req, res, next);
        }
        return uploader.single(this.fieldName)(req, res, next);
    }
};
GoogleStorageService = __decorate([
    injection_js_1.Injectable(),
    __metadata("design:paramtypes", [])
], GoogleStorageService);
exports.GoogleStorageService = GoogleStorageService;
//# sourceMappingURL=google-storage.service.js.map