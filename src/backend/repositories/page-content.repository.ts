import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepository, IBaseRepository } from './base.repository';
import { PageContent } from '../models/domain-models.types';
import { Result, success, failure } from '../types/result.types';
import { AppError } from '../errors/app-error';
import { getServerClient } from '../config/supabase.config';

export interface PageContentRepository extends IBaseRepository<PageContent, string, Partial<PageContent>, Partial<PageContent>> {
  findBySlug(slug: string): Promise<Result<PageContent | null, AppError>>;
}

export class SupabasePageContentRepository
  extends BaseRepository<PageContent, string, Partial<PageContent>, Partial<PageContent>>
  implements PageContentRepository {
  constructor(clientOrGetter?: SupabaseClient | (() => SupabaseClient)) {
    super('page_contents', clientOrGetter || (() => getServerClient()));
  }

  public async findBySlug(slug: string): Promise<Result<PageContent | null, AppError>> {
    const res = await this.findAll({ slug });
    if (!res.success) return failure(res.error);
    return success(res.value[0] || null);
  }
}
