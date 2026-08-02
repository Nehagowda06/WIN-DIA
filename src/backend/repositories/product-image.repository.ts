import { BaseRepository, IBaseRepository } from './base.repository';
import { ProductImage } from '../models/domain-models.types';
import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';

export interface ProductImageRepository extends IBaseRepository<ProductImage, string, Partial<ProductImage>, Partial<ProductImage>> {
  findByProductId(productId: string): Promise<Result<ProductImage[], AppError>>;
  uploadImage(bucket: string, path: string, fileBuffer: Buffer | Blob, contentType?: string): Promise<Result<string, AppError>>;
  deleteImage(bucket: string, path: string): Promise<Result<boolean, AppError>>;
}

export class SupabaseProductImageRepository
  extends BaseRepository<ProductImage, string, Partial<ProductImage>, Partial<ProductImage>>
  implements ProductImageRepository {
  constructor() {
    super('product_images');
  }

  public async findByProductId(productId: string): Promise<Result<ProductImage[], AppError>> {
    return this.findAll({ product_id: productId });
  }

  public async uploadImage(bucket: string, path: string, fileBuffer: Buffer | Blob, contentType?: string): Promise<Result<string, AppError>> {
    try {
      const client = this.getClient();
      const { data, error } = await client.storage
        .from(bucket)
        .upload(path, fileBuffer, { contentType, upsert: true });

      if (error) {
        return failure(this.handleError(error, 'uploadImage'));
      }

      const { data: publicUrlData } = client.storage.from(bucket).getPublicUrl(data.path);
      return success(publicUrlData.publicUrl);
    } catch (err) {
      return failure(this.handleError(err, 'uploadImage'));
    }
  }

  public async deleteImage(bucket: string, path: string): Promise<Result<boolean, AppError>> {
    try {
      const client = this.getClient();
      const { error } = await client.storage.from(bucket).remove([path]);

      if (error) {
        return failure(this.handleError(error, 'deleteImage'));
      }

      return success(true);
    } catch (err) {
      return failure(this.handleError(err, 'deleteImage'));
    }
  }
}
