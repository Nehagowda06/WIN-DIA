import { Result, failure, success } from '../types/result.types';
import { UserContext } from '../types/common.types';
import { AuthenticationError } from '../errors/domain-errors';
import { getServerClient, getAdminClient } from '../config/supabase.config';
import { UserRole } from '../enums/entity.enums';

/**
 * Extracts and verifies JWT bearer token or session header for Next.js Serverless requests
 */
export async function authenticateToken(authHeader?: string | null): Promise<Result<UserContext, AuthenticationError>> {

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn("[auth] Missing or invalid Authorization header");
    return failure(new AuthenticationError('Missing or invalid Authorization bearer token'));
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    console.warn("[auth] Bearer token payload is empty");
    return failure(new AuthenticationError('Bearer token payload is empty'));
  }

  try {
    const supabase = getServerClient(authHeader);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error("[auth] getUser failed:", error?.message);
      return failure(new AuthenticationError('Invalid or expired authentication token', error?.message));
    }


    // Fetch role from profiles table using admin client to bypass RLS
    // This matches the frontend isAdmin() behavior and ensures consistency
    const adminClient = getAdminClient();
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .maybeSingle();


    const userContext: UserContext = {
      id: user.id,
      email: user.email ?? '',
      role: (profile?.role as UserRole) || UserRole.CUSTOMER,
      fullName: profile?.full_name || user.user_metadata?.full_name || null,
    };

    return success(userContext);
  } catch (err) {
    console.error("[auth] Unexpected error:", err);
    return failure(new AuthenticationError('Authentication failed', err));
  }
}
