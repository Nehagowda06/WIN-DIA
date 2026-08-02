import { z } from 'zod';
import { RegexPatterns } from '../constants/app.constants';

/**
 * Base Zod validation primitive schemas
 */

export const uuidSchema = z.string().uuid('Invalid UUID format');

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(RegexPatterns.EMAIL, 'Invalid email address');

export const phoneSchema = z
  .string()
  .trim()
  .regex(RegexPatterns.PHONE_INDIA, 'Invalid Indian phone number (10 digits starting with 6-9)');

export const pincodeSchema = z
  .string()
  .trim()
  .regex(RegexPatterns.PINCODE_INDIA, 'Invalid Indian postal code (6 digits)');

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(RegexPatterns.SLUG, 'Invalid URL slug format');

export const moneySchema = z
  .number()
  .nonnegative('Amount cannot be negative')
  .max(10000000, 'Amount exceeds maximum allowable threshold');

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});
