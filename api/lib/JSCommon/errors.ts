export function HttpError(message, status) {
  this.name = 'HttpError';
  this.message = message || '';
  this.body = { message };
  const error = new Error(message);
  error.name = this.name;
  this.stack = error.stack;
  this.status = status || 500;
}

HttpError.prototype = Object.create(Error.prototype);

export function EmailReplacementError(message, key, value) {
  this.name = 'EmailReplacementError';
  this.message = message || '';
  this.body = { message };
  const error = new Error(message);
  error.name = this.name;
  this.stack = error.stack;
  this.key = key;
  this.value = value;
}

EmailReplacementError.prototype = Object.create(Error.prototype);
