"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable-next-line:import-name
const storage_1 = __importDefault(require("@google-cloud/storage"));
class GcsStorageEngine {
    constructor(opts) {
        this.gcobj = new storage_1.default({
            keyFilename: opts.keyFilename,
            projectId: opts.projectId,
        });
        this.gcsBucket = this.gcobj.bucket(opts.bucket);
        this.filenameGenerator = opts.filename || ((req, file1) => file1.fieldname);
        this.metadata = opts.metadata || {
            predefinedAcl: 'private',
        };
    }
    _handleFile(req, file, cb) {
        try {
            const filename = this.filenameGenerator(req, file);
            const gcFile = this.gcsBucket.file(filename);
            return file.stream.pipe(gcFile.createWriteStream(this.metadata))
                .on('error', err => cb(err))
                .on('finish', () => cb(undefined, {
                filename,
                path: `https://${this.gcsBucket.name}.storage.googleapis.com/${filename}`,
            }));
        }
        catch (error) {
            cb(error);
        }
    }
    _removeFile(req, file, cb) {
        const gcFile = this.gcsBucket.file(file.filename);
        gcFile.delete()
            .then(() => cb(new Error('successfully deleted')))
            .catch(err => cb(err));
    }
}
exports.GcsStorageEngine = GcsStorageEngine;
//# sourceMappingURL=gcs-storage.engine.js.map