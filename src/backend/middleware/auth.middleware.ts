import { Result, failure, success } from '../types/result.types';
import { UserContext } from '../types/common.types';
import { AuthenticationError } from '../errors/domain-errors';
import { getServerClient } from '../config/supabase.config';
import { UserRole } from '../enums/entity.enums';

/**
 * Extracts and verifies JWT bearer token or session header for Next.js Serverless requests
 */
export async function authenticateToken(authHeader?: string | null): Promise<Result<UserContext, AuthenticationError>> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return failure(new AuthenticationError('Missing or invalid Authorization bearer token'));
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return failure(new AuthenticationError('Bearer token payload is empty'));
  }

  try {
    const supabase = getServerClient(authHeader);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return failure(new AuthenticationError('Invalid or expired authentication token', error?.message));
    }

    const userContext: UserContext = {
      id: user.id,
      email: user.email ?? '',
      role: (user.app_metadata?.role as UserRole) || UserRole.CUSTOMER,
      fullName: user.user_metadata?.full_name || null,
    };

    return success(userContext);
  } catch (err) {
    return failure(new AuthenticationError('Authentication failed', err));
  }
}
