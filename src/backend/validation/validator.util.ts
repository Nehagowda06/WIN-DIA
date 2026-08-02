import { z } from 'zod';
import { Result, failure, success } from '../types/result.types';
import { ValidationError } from '../errors/domain-errors';

/**
 * Validates data against a Zod schema, returning a Result<T, ValidationError>
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): Result<T, ValidationError> {
  const result = schema.safeParse(data);

  if (!result.success) {
    const formatted = result.error.issues.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    return failure(new ValidationError('Data validation failed', formatted));
  }

  return success(result.data);
}
