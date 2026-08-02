import { BaseRepository, IBaseRepository } from './base.repository';
import { ContactMessage } from '../models/domain-models.types';
import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';

export interface ContactMessageRepository extends IBaseRepository<ContactMessage, string, Partial<ContactMessage>, Partial<ContactMessage>> {
  findByEmail(email: string): Promise<Result<ContactMessage[], AppError>>;
}

export class SupabaseContactMessageRepository
  extends BaseRepository<ContactMessage, string, Partial<ContactMessage>, Partial<ContactMessage>>
  implements ContactMessageRepository {
  constructor() {
    super('contact_messages');
  }

  public async findByEmail(email: string): Promise<Result<ContactMessage[], AppError>> {
    return this.findAll({ email });
  }
}
