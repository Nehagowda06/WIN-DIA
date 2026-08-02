import { BaseRepository, IBaseRepository } from './base.repository';
import { PageContent } from '../models/domain-models.types';
import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';

export interface PageContentRepository extends IBaseRepository<PageContent, string, Partial<PageContent>, Partial<PageContent>> {
  findBySlug(slug: string): Promise<Result<PageContent | null, AppError>>;
}

export class SupabasePageContentRepository
  extends BaseRepository<PageContent, string, Partial<PageContent>, Partial<PageContent>>
  implements PageContentRepository {
  constructor() {
    super('page_content');
  }

  public async findBySlug(slug: string): Promise<Result<PageContent | null, AppError>> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) {
        return failure(this.handleError(error, 'findBySlug'));
      }

      return success((data as PageContent) || null);
    } catch (err) {
      return failure(this.handleError(err, 'findBySlug'));
    }
  }
}
