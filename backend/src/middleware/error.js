const env = require('../config/env');

const notFound = (req, res) =>
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });

// Central error handler: every error in the app ends up here and returns the same JSON shape.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors;

  if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Request body is not valid JSON';
  } else if (err.code === '23505') {
    status = 409;
    message = String(err.constraint || '').includes('email')
      ? 'This email address is already registered'
      : 'A record with the same unique value already exists';
    if (String(err.constraint || '').includes('email')) errors = { email: message };
  } else if (err.code === '23503') {
    status = 409;
    message = 'This record is linked to other data or refers to data that does not exist';
  } else if (err.code === '23514' || err.code === '22P02') {
    status = 400;
    message = 'Invalid data supplied';
  } else if (!err.status) {
    console.error(err); // unexpected error: log it, hide details from client
    status = 500;
    message = env.nodeEnv === 'production' ? 'Internal server error' : err.message;
  }

  res.status(status).json({ success: false, message, ...(errors ? { errors } : {}) });
};

module.exports = { notFound, errorHandler };
