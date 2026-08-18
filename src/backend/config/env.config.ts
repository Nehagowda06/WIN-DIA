import { z } from 'zod';

/**
 * Helper for env vars that are optional and may be present as an empty string.
 * Equivalent to: z.string().optional().or(z.literal(''))
 */
const optionalString = () => z.string().optional().or(z.literal(''));

/**
 * Zod schema for environment variable validation
 */
export const envSchema = z.object({
  // Core
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, 'SUPABASE_SERVICE_ROLE_KEY is required')
    .optional()
    .or(z.literal('')),

  // Razorpay
  RAZORPAY_KEY_ID: optionalString(),
  RAZORPAY_KEY_SECRET: optionalString(),

  // SMTP
  SMTP_HOST: optionalString(),
  SMTP_PORT: z
    .string()
    .transform((val) => (val ? parseInt(val, 10) : 587))
    .optional(),
  SMTP_USER: optionalString(),
  SMTP_PASSWORD: optionalString(),
});

export type EnvConfig = z.infer<typeof envSchema>;

let parsedEnv: EnvConfig | null = null;

/**
 * Validates process.env and returns a strongly-typed, memoized environment config object.
 */
export function getEnv(): EnvConfig {
  if (parsedEnv) {
    return parsedEnv;
  }

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errorDetails = JSON.stringify(result.error.format(), null, 2);
    console.error('❌ Environment Variable Validation Failed:\n', errorDetails);
    throw new Error(`Environment variable validation failed: ${errorDetails}`);
  }

  parsedEnv = result.data;
  return parsedEnv;
}