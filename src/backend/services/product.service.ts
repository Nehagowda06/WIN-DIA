import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';
import { NotFoundError } from '../errors/domain-errors';
import { Category, Product, ProductVariant } from '../models/domain-models.types';
import { CreateProductDTO, CreateVariantDTO, PaginationQueryDTO } from '../types/dto.types';
import { ProductRepository } from '../repositories/product.repository';
import { ProductVariantRepository } from '../repositories/product-variant.repository';
import { CategoryRepository } from '../repositories/category.repository';
import { ProductStatus } from '../enums/entity.enums';
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
  getVariants(productId: string): Promise<Result<ProductVariant[], AppError>>;
  addVariant(dto: CreateVariantDTO): Promise<Result<ProductVariant, AppError>>;
  getCategories(): Promise<Result<Category[], AppError>>;
}

export class ProductServiceImpl implements ProductService {
  private productRepo: ProductRepository;
  private variantRepo: ProductVariantRepository;
  private categoryRepo: CategoryRepository;

  constructor(
    productRepo?: ProductRepository,
    variantRepo?: ProductVariantRepository,
    categoryRepo?: CategoryRepository
  ) {
    this.productRepo = productRepo || container.resolve<ProductRepository>(RepositoryTokens.ProductRepository);
    this.variantRepo = variantRepo || container.resolve<ProductVariantRepository>(RepositoryTokens.ProductVariantRepository);
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
    const filter: Record<string, unknown> = { status: ProductStatus.ACTIVE };
    return this.productRepo.findWithPagination(query.page, query.pageSize, filter, query.sortBy, query.sortOrder);
  }

  public async getFeaturedProducts(limit: number = 6): Promise<Result<Product[], AppError>> {
    const res = await this.productRepo.findAll({ status: ProductStatus.ACTIVE, is_featured: true });
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

    const res = await this.productRepo.findAll({ category_id: categoryId, status: ProductStatus.ACTIVE });
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
    return this.variantRepo.findByProductId(productId);
  }

  public async addVariant(dto: CreateVariantDTO): Promise<Result<ProductVariant, AppError>> {
    const product = await this.getProductById(dto.product_id);
    if (!product.success) return failure(product.error);

    return this.variantRepo.create(dto);
  }

  public async getCategories(): Promise<Result<Category[], AppError>> {
    return this.categoryRepo.findAll({ is_active: true });
  }
}
