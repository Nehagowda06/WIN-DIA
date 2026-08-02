import { BaseRepository, IBaseRepository } from './base.repository';
import { ProductVariant } from '../models/domain-models.types';
import { CreateVariantDTO } from '../types/dto.types';
import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';

export interface ProductVariantRepository extends IBaseRepository<ProductVariant, string, CreateVariantDTO, Partial<CreateVariantDTO>> {
  findByProductId(productId: string): Promise<Result<ProductVariant[], AppError>>;
  findBySku(sku: string): Promise<Result<ProductVariant | null, AppError>>;
}

export class SupabaseProductVariantRepository
  extends BaseRepository<ProductVariant, string, CreateVariantDTO, Partial<CreateVariantDTO>>
  implements ProductVariantRepository {
  constructor() {
    super('product_variants');
  }

  public async findByProductId(productId: string): Promise<Result<ProductVariant[], AppError>> {
    return this.findAll({ product_id: productId });
  }

  public async findBySku(sku: string): Promise<Result<ProductVariant | null, AppError>> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('sku', sku)
        .maybeSingle();

      if (error) {
        return failure(this.handleError(error, 'findBySku'));
      }

      return success((data as ProductVariant) || null);
    } catch (err) {
      return failure(this.handleError(err, 'findBySku'));
    }
  }
}
