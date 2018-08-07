function HttpError(message, status) {
  this.name = 'HttpError';
  this.message = message || '';
  const error = new Error(message);
  error.name = this.name;
  this.stack = error.stack;
  this.status = status || 500;
}

HttpError.prototype = Object.create(Error.prototype);
module.exports = HttpError;
