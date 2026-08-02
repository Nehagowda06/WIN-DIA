import { UserRole } from '../enums/entity.enums';

/**
 * Base Database Entity with tracking fields
 */
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at?: string | null;
}

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

/**
 * Authenticated User Context
 */
export interface UserContext {
  id: string;
  email: string;
  role: UserRole;
  fullName?: string | null;
}

/**
 * Request Context passed through backend services
 */
export interface RequestContext {
  user?: UserContext | null;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
}
