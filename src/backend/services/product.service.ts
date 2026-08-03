import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';
import { NotFoundError } from '../errors/domain-errors';
import { Category, Product, ProductVariant } from '../models/domain-models.types';
import { CreateProductDTO, CreateVariantDTO, PaginationQueryDTO } from '../types/dto.types';
import { ProductRepository } from '../repositories/product.repository';
import { CategoryRepository } from '../repositories/category.repository';
import { logger } from '../utils/logger.util';
import { container, RepositoryTokens } from '../providers/container.provider';

export interface ProductService {
  getProductById(id: string): Promise<Result<Product, AppError>>;
  getProductBySlug(slug: string): Promise<Result<Product, AppError>>;
  getProductWithRelations(id: string): Promise<Result<Record<string, unknown>, AppError>>;
  listProducts(query: PaginationQueryDTO): Promise<Result<{ items: Product[]; total: number }, AppError>>;
  getFeaturedProducts(limit?: number): Promise<Result<Product[], AppError>>;
  getRelatedProducts(productId: string, limit?: number): Promise<Result<Product[], AppError>>;
  createProduct(dto: CreateProductDTO): Promise<Result<Product, AppError>>;
  updateProduct(id: string, dto: Partial<CreateProductDTO>): Promise<Result<Product, AppError>>;
  deleteProduct(id: string): Promise<Result<boolean, AppError>>;
  // TODO: Re-enable when product_variants table is populated with production data
  getVariants(productId: string): Promise<Result<ProductVariant[], AppError>>;
  addVariant(dto: CreateVariantDTO): Promise<Result<ProductVariant, AppError>>;
  getCategories(): Promise<Result<Category[], AppError>>;
}

export class ProductServiceImpl implements ProductService {
  private productRepo: ProductRepository;
  private categoryRepo: CategoryRepository;

  constructor(
    productRepo?: ProductRepository,
    categoryRepo?: CategoryRepository
  ) {
    this.productRepo = productRepo || container.resolve<ProductRepository>(RepositoryTokens.ProductRepository);
    this.categoryRepo = categoryRepo || container.resolve<CategoryRepository>(RepositoryTokens.CategoryRepository);
  }

  public async getProductById(id: string): Promise<Result<Product, AppError>> {
    const res = await this.productRepo.findById(id);
    if (!res.success) return res;
    if (!res.value) {
      return failure(new NotFoundError(`Product not found with ID ${id}`));
    }
    return success(res.value);
  }

  public async getProductBySlug(slug: string): Promise<Result<Product, AppError>> {
    const res = await this.productRepo.findBySlug(slug);
    if (!res.success) return res;
    if (!res.value) {
      return failure(new NotFoundError(`Product not found with slug ${slug}`));
    }
    return success(res.value);
  }

  public async getProductWithRelations(id: string): Promise<Result<Record<string, unknown>, AppError>> {
    const res = await this.productRepo.findWithRelations(id);
    if (!res.success) return res;
    if (!res.value) {
      return failure(new NotFoundError(`Product with relations not found for ID ${id}`));
    }
    return success(res.value);
  }

  public async listProducts(query: PaginationQueryDTO): Promise<Result<{ items: Product[]; total: number }, AppError>> {
    const filter: Record<string, unknown> = { is_active: true };
    return this.productRepo.findWithPagination(query.page, query.pageSize, filter, query.sortBy, query.sortOrder);
  }

  public async getFeaturedProducts(limit: number = 6): Promise<Result<Product[], AppError>> {
    const res = await this.productRepo.findFeatured(limit);
    if (!res.success) return res;
    return success(res.value.slice(0, limit));
  }

  public async getRelatedProducts(productId: string, limit: number = 4): Promise<Result<Product[], AppError>> {
    const productRes = await this.getProductById(productId);
    if (!productRes.success) return failure(productRes.error);

    const categoryId = productRes.value.category_id;
    if (!categoryId) {
      return this.getFeaturedProducts(limit);
    }

    const res = await this.productRepo.findAll({ category_id: categoryId, is_active: true });
    if (!res.success) return res;

    const filtered = res.value.filter((p) => p.id !== productId).slice(0, limit);
    return success(filtered);
  }

  public async createProduct(dto: CreateProductDTO): Promise<Result<Product, AppError>> {
    logger.info(`[ProductService.createProduct] Creating product: ${dto.name}`);
    return this.productRepo.create(dto);
  }

  public async updateProduct(id: string, dto: Partial<CreateProductDTO>): Promise<Result<Product, AppError>> {
    const existing = await this.getProductById(id);
    if (!existing.success) return existing;
    return this.productRepo.update(id, dto);
  }

  public async deleteProduct(id: string): Promise<Result<boolean, AppError>> {
    const existing = await this.getProductById(id);
    if (!existing.success) return failure(existing.error);
    return this.productRepo.delete(id);
  }

  public async getVariants(productId: string): Promise<Result<ProductVariant[], AppError>> {
    // TODO: product_variants table has no production data.
    // When variants are populated, replace this stub with: return this.variantRepo.findByProductId(productId);
    logger.warn(`[ProductService.getVariants] product_variants table is unpopulated — returning empty array for product ${productId}`);
    return success([]);
  }

  public async addVariant(dto: CreateVariantDTO): Promise<Result<ProductVariant, AppError>> {
    // TODO: product_variants table has no production data.
    // When variants are activated, replace this stub with actual variant creation logic.
    logger.warn(`[ProductService.addVariant] product_variants table is unpopulated — addVariant is a no-op stub`);
    return failure(new NotFoundError('Variant management is not yet enabled in this deployment'));
  }

  public async getCategories(): Promise<Result<Category[], AppError>> {
    return this.categoryRepo.findAll({ is_active: true });
  }
}
