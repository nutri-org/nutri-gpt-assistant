
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const bodySchema = {
  type: 'object',
  required: ['userId', 'messages'],
  additionalProperties: false,
  properties: {
    mode:      { type: 'string', enum: ['meal_plan_strict', 'goal_motivation'] },
    userId:    { type: 'string', minLength: 1 },
    messages:  {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['role', 'content'],
        properties: {
          role:    { type: 'string', enum: ['user', 'assistant', 'system'] },
          content: { type: 'string', minLength: 1 }
        }
      }
    },
    context:   { type: 'object' }
  }
};

const validate = ajv.compile(bodySchema);

module.exports = function validateBody (req, res, next) {
  if (validate(req.body)) { return next(); }
  return res.status(400).json({ error: 'BAD_REQUEST', details: validate.errors });
};
