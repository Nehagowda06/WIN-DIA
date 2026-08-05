import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';
import { AuthenticationError, AuthorizationError, ValidationError } from '../errors/domain-errors';
import { Profile } from '../models/domain-models.types';
import { UserContext } from '../types/common.types';
import { UserRole } from '../enums/entity.enums';
import { ProfileRepository } from '../repositories/profile.repository';
import { logger } from '../utils/logger.util';
import { container, RepositoryTokens } from '../providers/container.provider';
import { getAdminClient } from '../config/supabase.config';

export interface AuthService {
  login(email: string): Promise<Result<Profile, AppError>>;
  register(email: string, password: string, fullName?: string, phone?: string): Promise<Result<Profile, AppError>>;
  logout(userId: string): Promise<Result<boolean, AppError>>;
  passwordReset(email: string): Promise<Result<boolean, AppError>>;
  verifyEmail(email: string): Promise<Result<boolean, AppError>>;
  validateSession(userContext?: UserContext | null): Promise<Result<UserContext, AppError>>;
  checkRole(userContext: UserContext | null | undefined, allowedRoles: UserRole[]): Promise<Result<UserContext, AppError>>;
}

export class AuthServiceImpl implements AuthService {
  private profileRepo: ProfileRepository;

  constructor(profileRepo?: ProfileRepository) {
    this.profileRepo = profileRepo || container.resolve<ProfileRepository>(RepositoryTokens.ProfileRepository);
  }

  public async login(email: string): Promise<Result<Profile, AppError>> {
    logger.info(`[AuthService.login] Attempting login for ${email}`);
    const res = await this.profileRepo.findByEmail(email);
    if (!res.success) return res;

    if (!res.value) {
      return failure(new AuthenticationError('Invalid email or user profile not found'));
    }

    return success(res.value);
  }

  public async register(email: string, password: string, fullName?: string, phone?: string): Promise<Result<Profile, AppError>> {
    logger.info(`[AuthService.register] Registering new user: ${email}`);
    if (!password || password.length < 6) {
      return failure(new ValidationError('Password must be at least 6 characters'));
    }

    const existing = await this.profileRepo.findByEmail(email);
    if (!existing.success) return existing;
    if (existing.value) {
      return failure(new ValidationError('User with this email already exists'));
    }

    const admin = getAdminClient();
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName || '', phone: phone || '' },
    });
    if (authError || !authData.user) {
      const message = authError?.message?.toLowerCase().includes('already')
        ? 'User with this email already exists'
        : authError?.message || 'Could not create account';
      return failure(new ValidationError(message, authError));
    }

    const { data: profile, error: profileError } = await admin.from('profiles').upsert({
      id: authData.user.id,
      email,
      full_name: fullName || null,
      phone: phone || null,
      role: UserRole.CUSTOMER,
    }).select('*').single();

    if (profileError || !profile) {
      await admin.auth.admin.deleteUser(authData.user.id);
      return failure(new AppError('Could not create account profile', 500, 'INTERNAL_SERVER_ERROR', true, profileError));
    }

    return success(profile as Profile);
  }

  public async logout(userId: string): Promise<Result<boolean, AppError>> {
    logger.info(`[AuthService.logout] Logging out user ${userId}`);
    return success(true);
  }

  public async passwordReset(email: string): Promise<Result<boolean, AppError>> {
    logger.info(`[AuthService.passwordReset] Password reset requested for ${email}`);
    const profileRes = await this.profileRepo.findByEmail(email);
    if (!profileRes.success) return failure(profileRes.error);
    if (!profileRes.value) {
      return failure(new AuthenticationError('User email not registered'));
    }

    return success(true);
  }

  public async verifyEmail(email: string): Promise<Result<boolean, AppError>> {
    logger.info(`[AuthService.verifyEmail] Email verification processed for ${email}`);
    return success(true);
  }

  public async validateSession(userContext?: UserContext | null): Promise<Result<UserContext, AppError>> {
    if (!userContext || !userContext.id) {
      return failure(new AuthenticationError('User context is invalid or unauthenticated'));
    }
    return success(userContext);
  }

  public async checkRole(userContext: UserContext | null | undefined, allowedRoles: UserRole[]): Promise<Result<UserContext, AppError>> {
    const sessionRes = await this.validateSession(userContext);
    if (!sessionRes.success) return sessionRes;

    const user = sessionRes.value;
    if (!allowedRoles.includes(user.role)) {
      return failure(new AuthorizationError(`Access denied: Required role ${allowedRoles.join(' or ')}, found ${user.role}`));
    }

    return success(user);
  }
}
