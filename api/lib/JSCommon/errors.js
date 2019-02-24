"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function HttpError(message, status) {
    this.name = 'HttpError';
    this.message = message || '';
    this.body = { message };
    const error = new Error(message);
    error.name = this.name;
    this.stack = error.stack;
    this.status = status || 500;
}
exports.HttpError = HttpError;
HttpError.prototype = Object.create(Error.prototype);
function EmailReplacementError(message, key, value) {
    this.name = 'EmailReplacementError';
    this.message = message || '';
    this.body = { message };
    const error = new Error(message);
    error.name = this.name;
    this.stack = error.stack;
    this.key = key;
    this.value = value;
}
exports.EmailReplacementError = EmailReplacementError;
EmailReplacementError.prototype = Object.create(Error.prototype);
function RouteNotImplementedError(message) {
    this.name = 'RouteNotImplementedError';
    this.message = message || 'Route not implemented';
    this.body = { message };
    this.status = 501;
    const error = new Error(message);
    error.name = this.name;
    this.stack = error.stack;
}
exports.RouteNotImplementedError = RouteNotImplementedError;
RouteNotImplementedError.prototype = Object.create(Error.prototype);
function MethodNotImplementedError(message) {
    this.name = 'MethodNotImplementedError';
    this.message = message || 'Method not implemented';
    this.body = { message };
    const error = new Error(message);
    error.name = this.name;
    this.stack = error.stack;
}
exports.MethodNotImplementedError = MethodNotImplementedError;
MethodNotImplementedError.prototype = Object.create(Error.prototype);
//# sourceMappingURL=errors.js.map