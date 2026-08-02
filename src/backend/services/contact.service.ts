import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';
import { NotFoundError, ValidationError } from '../errors/domain-errors';
import { ContactMessage } from '../models/domain-models.types';
import { ContactMessageStatus } from '../enums/entity.enums';
import { ContactMessageRepository } from '../repositories/contact-message.repository';
import { logger } from '../utils/logger.util';
import { container, RepositoryTokens } from '../providers/container.provider';

export interface SubmitContactDTO {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

export interface ContactService {
  submitMessage(dto: SubmitContactDTO): Promise<Result<ContactMessage, AppError>>;
  updateStatus(id: string, status: ContactMessageStatus): Promise<Result<ContactMessage, AppError>>;
  listMessages(): Promise<Result<ContactMessage[], AppError>>;
}

export class ContactServiceImpl implements ContactService {
  private contactRepo: ContactMessageRepository;

  constructor(contactRepo?: ContactMessageRepository) {
    this.contactRepo = contactRepo || container.resolve<ContactMessageRepository>(RepositoryTokens.ContactMessageRepository);
  }

  public async submitMessage(dto: SubmitContactDTO): Promise<Result<ContactMessage, AppError>> {
    logger.info(`[ContactService.submitMessage] Message received from ${dto.email}`);
    if (!dto.name || !dto.email || !dto.message) {
      return failure(new ValidationError('Name, email, and message are required'));
    }

    return this.contactRepo.create({
      name: dto.name,
      email: dto.email,
      subject: dto.subject || null,
      message: dto.message,
      status: ContactMessageStatus.NEW,
    });
  }

  public async updateStatus(id: string, status: ContactMessageStatus): Promise<Result<ContactMessage, AppError>> {
    const existing = await this.contactRepo.findById(id);
    if (!existing.success) return existing;
    if (!existing.value) {
      return failure(new NotFoundError(`Contact message ID ${id} not found`));
    }

    return this.contactRepo.update(id, { status });
  }

  public async listMessages(): Promise<Result<ContactMessage[], AppError>> {
    return this.contactRepo.findAll();
  }
}
