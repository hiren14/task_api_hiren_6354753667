import Joi from 'joi';
import { RequestSchema } from '../middleware/validate.middleware';

const taskStatus = Joi.string()
  .valid('pending', 'in_progress', 'completed')
  .messages({
    'any.only': 'Status must be pending, in_progress, or completed',
  });

export const createTaskSchema: RequestSchema = {
  body: Joi.object({
    title: Joi.string().min(1).max(255).required().messages({
      'any.required': 'Title is required',
      'string.empty': 'Title cannot be empty',
      'string.max': 'Title must be at most 255 characters',
    }),
    description: Joi.string().max(5000).optional().allow('').messages({
      'string.max': 'Description must be at most 5000 characters',
    }),
    status: taskStatus.optional(),
  }),
};

export const updateTaskSchema: RequestSchema = {
  body: Joi.object({
    title: Joi.string().min(1).max(255).optional().messages({
      'string.empty': 'Title cannot be empty',
      'string.max': 'Title must be at most 255 characters',
    }),
    description: Joi.string().max(5000).optional().allow('').messages({
      'string.max': 'Description must be at most 5000 characters',
    }),
    status: taskStatus.optional(),
  }),
};

export const paginationSchema: RequestSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1).messages({
      'number.min': 'Page must be at least 1',
      'number.integer': 'Page must be an integer',
    }),
    limit: Joi.number().integer().min(1).max(100).default(10).messages({
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must be at most 100',
    }),
  }),
};
