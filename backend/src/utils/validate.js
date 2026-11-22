const ApiError = require('./ApiError');

// validate(schema) checks req.body with a Zod schema and stores the clean result in req.validated
const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source] ?? {});
  if (!result.success) {
    const errors = {};
    result.error.issues.forEach((issue) => {
      const key = issue.path.join('.') || '_';
      if (!errors[key]) errors[key] = issue.message;
    });
    return next(new ApiError(400, 'Validation failed', errors));
  }
  req.validated = result.data;
  next();
};

module.exports = validate;
