import { BaseRepository, IBaseRepository } from './base.repository';
import { Product } from '../models/domain-models.types';
import { CreateProductDTO } from '../types/dto.types';
import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';

export interface ProductRepository extends IBaseRepository<Product, string, CreateProductDTO, Partial<CreateProductDTO>> {
  findBySlug(slug: string): Promise<Result<Product | null, AppError>>;
  findWithRelations(productId: string): Promise<Result<Record<string, unknown> | null, AppError>>;
}

export class SupabaseProductRepository
  extends BaseRepository<Product, string, CreateProductDTO, Partial<CreateProductDTO>>
  implements ProductRepository {
  constructor() {
    super('products');
  }

  public async findBySlug(slug: string): Promise<Result<Product | null, AppError>> {
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

      return success((data as Product) || null);
    } catch (err) {
      return failure(this.handleError(err, 'findBySlug'));
    }
  }

  public async findWithRelations(productId: string): Promise<Result<Record<string, unknown> | null, AppError>> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select(`
          *,
          category:categories(*),
          variants:product_variants(*),
          images:product_images(*)
        `)
        .eq('id', productId)
        .maybeSingle();

      if (error) {
        return failure(this.handleError(error, 'findWithRelations'));
      }

      return success(data || null);
    } catch (err) {
      return failure(this.handleError(err, 'findWithRelations'));
    }
  }
}
