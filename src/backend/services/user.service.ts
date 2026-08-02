import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';
import { NotFoundError } from '../errors/domain-errors';
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
  addAddress(userId: string, dto: CreateAddressDTO): Promise<Result<Address, AppError>>;
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
    const res = await this.profileRepo.findById(userId);
    if (!res.success) return res;
    if (!res.value) {
      return failure(new NotFoundError(`Profile not found for user ID ${userId}`));
    }
    return success(res.value);
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

  public async addAddress(userId: string, dto: CreateAddressDTO): Promise<Result<Address, AppError>> {
    logger.info(`[UserService.addAddress] Adding new address for ${userId}`);
    const addressesRes = await this.addressRepo.findByUserId(userId);
    const hasExisting = addressesRes.success && addressesRes.value.length > 0;

    const newAddress: CreateAddressDTO = {
      ...dto,
      is_default: dto.is_default !== undefined ? dto.is_default : !hasExisting,
    };

    return this.addressRepo.create({ ...newAddress, user_id: userId } as any);
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
