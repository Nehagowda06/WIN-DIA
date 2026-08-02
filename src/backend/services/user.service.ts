import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';
import { NotFoundError, ValidationError } from '../errors/domain-errors';
import { Address, Profile } from '../models/domain-models.types';
import { CreateAddressDTO, UpdateProfileDTO } from '../types/dto.types';
import { ProfileRepository } from '../repositories/profile.repository';
import { AddressRepository } from '../repositories/address.repository';
import { logger } from '../utils/logger.util';
import { container, RepositoryTokens } from '../providers/container.provider';

export interface UserService {
  getProfile(userId: string): Promise<Result<Profile, AppError>>;
  updateProfile(userId: string, dto: UpdateProfileDTO): Promise<Result<Profile, AppError>>;
  getUserAddresses(userId: string): Promise<Result<Address[], AppError>>;
  addAddress(userId: string, dto: any): Promise<Result<Address, AppError>>;
  updateAddress(addressId: string, userId: string, dto: Partial<CreateAddressDTO>): Promise<Result<Address, AppError>>;
  deleteAddress(addressId: string, userId: string): Promise<Result<boolean, AppError>>;
  setDefaultAddress(addressId: string, userId: string): Promise<Result<boolean, AppError>>;
}

export class UserServiceImpl implements UserService {
  private profileRepo: ProfileRepository;
  private addressRepo: AddressRepository;

  constructor(profileRepo?: ProfileRepository, addressRepo?: AddressRepository) {
    this.profileRepo = profileRepo || container.resolve<ProfileRepository>(RepositoryTokens.ProfileRepository);
    this.addressRepo = addressRepo || container.resolve<AddressRepository>(RepositoryTokens.AddressRepository);
  }

  public async getProfile(userId: string): Promise<Result<Profile, AppError>> {
    logger.info(`[UserService.getProfile] Fetching profile for ${userId}`);
    const res = await this.profileRepo.findById(userId);
    if (res.success && res.value) {
      return success(res.value);
    }

    // Auto-create missing profile gracefully to prevent checkout / user profile errors
    const createRes = await this.profileRepo.create({
      id: userId,
      full_name: 'Valued Customer',
      phone: '',
      avatar_url: null,
    } as any);

    if (createRes.success) {
      return success(createRes.value);
    }

    return failure(new NotFoundError(`Profile for user ${userId} not found`));
  }

  public async updateProfile(userId: string, dto: UpdateProfileDTO): Promise<Result<Profile, AppError>> {
    logger.info(`[UserService.updateProfile] Updating profile for ${userId}`);
    const existing = await this.getProfile(userId);
    if (!existing.success) return existing;

    return this.profileRepo.update(userId, dto);
  }

  public async getUserAddresses(userId: string): Promise<Result<Address[], AppError>> {
    return this.addressRepo.findByUserId(userId);
  }

  public async addAddress(userId: string, dto: any): Promise<Result<Address, AppError>> {
    logger.info(`[UserService.addAddress] Adding new address for ${userId}`);
    const addressesRes = await this.addressRepo.findByUserId(userId);
    const hasExisting = addressesRes.success && addressesRes.value.length > 0;

    const postalCode = String(dto.pincode || dto.postal_code || '');
    const addressLine1 = dto.address_line1 || dto.street || '';

    if (!addressLine1 || !dto.city || !postalCode) {
      return failure(new ValidationError('Street address, city, and pincode are required'));
    }

    const payload: any = {
      user_id: userId,
      full_name: dto.full_name || dto.name || 'Valued Customer',
      phone: String(dto.phone || ''),
      address_line1: addressLine1,
      address_line2: dto.address_line2 || null,
      city: dto.city || '',
      state: dto.state || '',
      pincode: postalCode,
      postal_code: postalCode,
      country: dto.country || 'India',
      address_type: dto.address_type || dto.type || 'shipping',
      is_default: dto.is_default !== undefined ? Boolean(dto.is_default) : (dto.isDefault !== undefined ? Boolean(dto.isDefault) : !hasExisting),
    };

    return this.addressRepo.create(payload);
  }

  public async updateAddress(addressId: string, userId: string, dto: Partial<CreateAddressDTO>): Promise<Result<Address, AppError>> {
    const addrRes = await this.addressRepo.findById(addressId);
    if (!addrRes.success) return failure(addrRes.error);
    if (!addrRes.value || addrRes.value.user_id !== userId) {
      return failure(new NotFoundError('Address not found or permission denied'));
    }

    return this.addressRepo.update(addressId, dto as any);
  }

  public async deleteAddress(addressId: string, userId: string): Promise<Result<boolean, AppError>> {
    const addrRes = await this.addressRepo.findById(addressId);
    if (!addrRes.success) return failure(addrRes.error);
    if (!addrRes.value || addrRes.value.user_id !== userId) {
      return failure(new NotFoundError('Address not found or permission denied'));
    }

    return this.addressRepo.delete(addressId);
  }

  public async setDefaultAddress(addressId: string, userId: string): Promise<Result<boolean, AppError>> {
    const addressesRes = await this.addressRepo.findByUserId(userId);
    if (!addressesRes.success) return failure(addressesRes.error);

    const target = addressesRes.value.find((a) => a.id === addressId);
    if (!target) {
      return failure(new NotFoundError('Address not found'));
    }

    for (const addr of addressesRes.value) {
      if (addr.is_default && addr.id !== addressId) {
        await this.addressRepo.update(addr.id, { is_default: false });
      }
    }

    const updateRes = await this.addressRepo.update(addressId, { is_default: true });
    if (!updateRes.success) return failure(updateRes.error);

    return success(true);
  }
}
