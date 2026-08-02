import { Category, Product, ProductVariant } from '../models/domain-models.types';
import { CreateProductDTO, CreateVariantDTO, PaginationQueryDTO } from '../types/dto.types';
import { Result } from '../types/result.types';
import { AppError } from '../errors/app-error';

export interface ProductService {
  getProductById(id: string): Promise<Result<Product, AppError>>;
  getProductBySlug(slug: string): Promise<Result<Product, AppError>>;
  listProducts(query: PaginationQueryDTO): Promise<Result<{ items: Product[]; total: number }, AppError>>;
  getFeaturedProducts(limit?: number): Promise<Result<Product[], AppError>>;
  createProduct(dto: CreateProductDTO): Promise<Result<Product, AppError>>;
  updateProduct(id: string, dto: Partial<CreateProductDTO>): Promise<Result<Product, AppError>>;
  deleteProduct(id: string): Promise<Result<boolean, AppError>>;
  getVariants(productId: string): Promise<Result<ProductVariant[], AppError>>;
  addVariant(dto: CreateVariantDTO): Promise<Result<ProductVariant, AppError>>;
  getCategories(): Promise<Result<Category[], AppError>>;
}
