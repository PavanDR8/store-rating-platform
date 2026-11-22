// An error with an HTTP status code. Thrown anywhere, formatted by the error middleware.
class ApiError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors; // optional: { fieldName: 'message' }
  }
}
module.exports = ApiError;
