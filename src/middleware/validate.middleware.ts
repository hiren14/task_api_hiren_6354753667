import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export interface RequestSchema {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}

/**
 * Middleware factory that validates request body, query, and/or params
 * against Joi schemas. Returns 422 with field-level error messages on failure.
 */
export const validate =
  (schema: RequestSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    const sections = ['body', 'query', 'params'] as const;

    for (const section of sections) {
      const sectionSchema = schema[section];
      if (!sectionSchema) continue;

      const { error } = sectionSchema.validate(req[section], {
        abortEarly: false,   // collect all errors, not just first
        allowUnknown: false, // reject unknown keys
        stripUnknown: true,  // silently remove unknown keys from req
      });

      if (error) {
        for (const detail of error.details) {
          // Prefix with section only when validating more than body
          const field = section === 'body'
            ? detail.path.join('.')
            : `${section}.${detail.path.join('.')}`;
          errors.push(`${field}: ${detail.message.replace(/['"]/g, '')}`);
        }
      }
    }

    if (errors.length > 0) {
      res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
      return;
    }

    next();
  };
