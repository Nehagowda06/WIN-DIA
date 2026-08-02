import { Address, Profile } from '../models/domain-models.types';
import { CreateAddressDTO, UpdateProfileDTO } from '../types/dto.types';
import { Result } from '../types/result.types';
import { AppError } from '../errors/app-error';

export interface UserService {
  getProfile(userId: string): Promise<Result<Profile, AppError>>;
  updateProfile(userId: string, dto: UpdateProfileDTO): Promise<Result<Profile, AppError>>;
  getUserAddresses(userId: string): Promise<Result<Address[], AppError>>;
  addAddress(userId: string, dto: CreateAddressDTO): Promise<Result<Address, AppError>>;
  updateAddress(addressId: string, userId: string, dto: Partial<CreateAddressDTO>): Promise<Result<Address, AppError>>;
  deleteAddress(addressId: string, userId: string): Promise<Result<boolean, AppError>>;
  setDefaultAddress(addressId: string, userId: string): Promise<Result<boolean, AppError>>;
}
