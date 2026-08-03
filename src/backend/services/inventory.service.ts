import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';
import { InventoryError, NotFoundError } from '../errors/domain-errors';
import { Product } from '../models/domain-models.types';
import { ProductRepository } from '../repositories/product.repository';
import { logger } from '../utils/logger.util';
import { container, RepositoryTokens } from '../providers/container.provider';

export interface InventoryService {
  validateStock(productId: string, requiredQuantity: number): Promise<Result<Product, AppError>>;
  deductStockAfterSuccessfulPayment(productId: string, quantity: number): Promise<Result<Product, AppError>>;
  restoreStockAfterCancellation(productId: string, quantity: number): Promise<Result<Product, AppError>>;
}

export class InventoryServiceImpl implements InventoryService {
  private productRepo: ProductRepository;

  constructor(productRepo?: ProductRepository) {
    this.productRepo = productRepo || container.resolve<ProductRepository>(RepositoryTokens.ProductRepository);
  }

  public async validateStock(productId: string, requiredQuantity: number): Promise<Result<Product, AppError>> {
    const productRes = await this.productRepo.findById(productId);
    if (!productRes.success) return productRes;
    if (!productRes.value || !productRes.value.is_active) {
      return failure(new NotFoundError(`Product ID ${productId} is invalid or inactive`));
    }

    const product = productRes.value;
    if (product.count_in_stock < requiredQuantity) {
      logger.warn(
        `[InventoryService] Low stock for product ${product.sku ?? product.id}: ` +
        `requested ${requiredQuantity}, available ${product.count_in_stock}`
      );
      return failure(
        new InventoryError(
          `Insufficient inventory for "${product.name}". Available stock: ${product.count_in_stock}`
        )
      );
    }

    return success(product);
  }

  public async deductStockAfterSuccessfulPayment(productId: string, quantity: number): Promise<Result<Product, AppError>> {
    logger.info(`[InventoryService] Deducting ${quantity} stock for product ${productId} after payment`);
    const validRes = await this.validateStock(productId, quantity);
    if (!validRes.success) return validRes;

    const product = validRes.value;
    const newStock = product.count_in_stock - quantity;
    return this.productRepo.update(productId, { count_in_stock: newStock });
  }

  public async restoreStockAfterCancellation(productId: string, quantity: number): Promise<Result<Product, AppError>> {
    logger.info(`[InventoryService] Restoring ${quantity} stock for product ${productId} after cancellation`);
    const productRes = await this.productRepo.findById(productId);
    if (!productRes.success) return productRes;
    if (!productRes.value) {
      return failure(new NotFoundError(`Product ID ${productId} not found to restore stock`));
    }

    const newStock = productRes.value.count_in_stock + quantity;
    return this.productRepo.update(productId, { count_in_stock: newStock });
  }
}
