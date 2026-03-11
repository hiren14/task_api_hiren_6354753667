import Joi from 'joi';
import { RequestSchema } from '../middleware/validate.middleware';

export const loginSchema: RequestSchema = {
  body: Joi.object({
    email: Joi.string().email().required().messages({
      'any.required': 'Email is required',
      'string.email': 'Must be a valid email address',
      'string.empty': 'Email cannot be empty',
    }),
    password: Joi.string().min(6).required().messages({
      'any.required': 'Password is required',
      'string.min': 'Password must be at least 6 characters',
      'string.empty': 'Password cannot be empty',
    }),
  }),
};
