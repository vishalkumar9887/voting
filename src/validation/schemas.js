const Joi = require('joi');

// User validation schemas
const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  email: Joi.string().email()
});

// Poll validation schemas
const createPollSchema = Joi.object({
  question: Joi.string().min(5).max(500).required(),
  options: Joi.array().items(
    Joi.string().min(1).max(200)
  ).min(2).max(10).required(),
  isPublished: Joi.boolean().default(false)
});

const updatePollSchema = Joi.object({
  question: Joi.string().min(5).max(500),
  isPublished: Joi.boolean()
});

// Vote validation schemas
const createVoteSchema = Joi.object({
  pollOptionId: Joi.string().required()
});

// Query parameter validation
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'question').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  createPollSchema,
  updatePollSchema,
  createVoteSchema,
  paginationSchema
};
