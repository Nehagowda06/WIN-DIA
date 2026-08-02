import { Result } from '../types/result.types';
import { AppError } from '../errors/app-error';
import { Profile } from '../models/domain-models.types';
import { UserContext } from '../types/common.types';

export interface AuthService {
  verifyToken(authHeader?: string): Promise<Result<UserContext, AppError>>;
  getCurrentUser(userId: string): Promise<Result<Profile, AppError>>;
  logout(userId: string): Promise<Result<boolean, AppError>>;
}
