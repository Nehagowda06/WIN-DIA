import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';
import { NotFoundError } from '../errors/domain-errors';
import { Setting } from '../models/domain-models.types';
import { SettingsRepository } from '../repositories/settings.repository';
import { container, RepositoryTokens } from '../providers/container.provider';

export interface SettingsService {
  getSettingByKey(key: string): Promise<Result<Setting, AppError>>;
  getPublicSettings(): Promise<Result<Record<string, unknown>, AppError>>;
  updateSetting(key: string, value: Record<string, unknown>): Promise<Result<Setting, AppError>>;
}

export class SettingsServiceImpl implements SettingsService {
  private settingsRepo: SettingsRepository;

  constructor(settingsRepo?: SettingsRepository) {
    this.settingsRepo = settingsRepo || container.resolve<SettingsRepository>(RepositoryTokens.SettingsRepository);
  }

  public async getSettingByKey(key: string): Promise<Result<Setting, AppError>> {
    const res = await this.settingsRepo.findByKey(key);
    if (!res.success) return res;
    if (!res.value) {
      return failure(new NotFoundError(`Setting key "${key}" not found`));
    }
    return success(res.value);
  }

  public async getPublicSettings(): Promise<Result<Record<string, unknown>, AppError>> {
    const res = await this.settingsRepo.findAll();
    if (!res.success) return failure(res.error);

    const publicSettings: Record<string, unknown> = {};
    for (const setting of res.value) {
      if (!setting.key.startsWith('secret_') && !setting.key.startsWith('private_')) {
        publicSettings[setting.key] = setting.value;
      }
    }
    return success(publicSettings);
  }

  public async updateSetting(key: string, value: Record<string, unknown>): Promise<Result<Setting, AppError>> {
    const existing = await this.settingsRepo.findByKey(key);
    if (!existing.success) return existing;

    if (existing.value) {
      return this.settingsRepo.update(existing.value.id, { value });
    }

    return this.settingsRepo.create({ key, value });
  }
}
