import { Result, failure, success } from '../types/result.types';
import { UserContext } from '../types/common.types';
import { AuthorizationError } from '../errors/domain-errors';
import { UserRole } from '../enums/entity.enums';

/**
 * Validates that authenticated user has one of the allowed roles
 */
export function requireRole(
  user: UserContext | null | undefined,
  allowedRoles: UserRole[]
): Result<UserContext, AuthorizationError> {
  if (!user) {
    return failure(new AuthorizationError('User context is missing or unauthenticated'));
  }

  if (!allowedRoles.includes(user.role)) {
    return failure(
      new AuthorizationError(`Access denied: required role ${allowedRoles.join(' or ')}, received ${user.role}`)
    );
  }

  return success(user);
}

/**
 * Validates that authenticated user has Admin role
 */
export function requireAdmin(
  user: UserContext | null | undefined
): Result<UserContext, AuthorizationError> {
  return requireRole(user, [UserRole.ADMIN]);
}
