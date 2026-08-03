import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepository, IBaseRepository } from './base.repository';
import { ContactMessage } from '../models/domain-models.types';
import { getServerClient } from '../config/supabase.config';

export interface ContactMessageRepository extends IBaseRepository<ContactMessage, string, Partial<ContactMessage>, Partial<ContactMessage>> {}

export class SupabaseContactMessageRepository
  extends BaseRepository<ContactMessage, string, Partial<ContactMessage>, Partial<ContactMessage>>
  implements ContactMessageRepository {
  constructor(clientOrGetter?: SupabaseClient | (() => SupabaseClient)) {
    super('contact_messages', clientOrGetter || (() => getServerClient()));
  }
}
