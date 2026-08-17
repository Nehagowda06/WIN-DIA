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

    // ATOMIC stock decrement via atomic_deduct_stock() RPC.
    // Returns TRUE if stock was successfully decremented, FALSE if insufficient stock.
    // No fallback paths — the RPC migration MUST be deployed.
    const { getAdminClient } = require('../config/supabase.config');
    const client = getAdminClient();

    const { data, error } = await client
      .rpc('atomic_deduct_stock', {
        p_product_id: productId,
        p_quantity: quantity,
      });

    if (error) {
      logger.error(`[InventoryService] atomic_deduct_stock RPC failed for product ${productId}:`, error);
      return failure(
        new InventoryError(
          `Stock deduction failed for product ${productId}: ${error.message}. ` +
          `Ensure the atomic_deduct_stock migration has been deployed.`
        )
      );
    }

    // RPC returns FALSE when count_in_stock < quantity (insufficient stock)
    if (data === false) {
      const productRes = await this.productRepo.findById(productId);
      const currentStock = productRes.success ? productRes.value?.count_in_stock : 'unknown';
      return failure(
        new InventoryError(
          `Insufficient stock for product ${productId}: available ${currentStock}, requested ${quantity}. ` +
          `Payment was captured but stock could not be reserved — manual reconciliation required.`
        )
      );
    }

    // Re-fetch the updated product
    return this.productRepo.findById(productId);
  }

  public async restoreStockAfterCancellation(productId: string, quantity: number): Promise<Result<Product, AppError>> {
    logger.info(`[InventoryService] Restoring ${quantity} stock for product ${productId} after cancellation`);

    // ATOMIC stock restoration via atomic_restore_stock() RPC.
    // Prevents race conditions when multiple cancellations happen concurrently.
    const { getAdminClient } = require('../config/supabase.config');
    const client = getAdminClient();

    const { data, error } = await client
      .rpc('atomic_restore_stock', {
        p_product_id: productId,
        p_quantity: quantity,
      });

    if (error) {
      logger.error(`[InventoryService] atomic_restore_stock RPC failed for product ${productId}:`, error);
      return failure(
        new InventoryError(
          `Stock restoration failed for product ${productId}: ${error.message}. ` +
          `Ensure the atomic_restore_stock migration has been deployed.`
        )
      );
    }

    // Re-fetch the updated product
    return this.productRepo.findById(productId);
  }
}
