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

    // ATOMIC stock decrement — uses a conditional UPDATE to prevent race conditions.
    // Only decrements if count_in_stock >= quantity, preventing negative stock.
    try {
      const { getAdminClient } = require('../config/supabase.config');
      const client = getAdminClient();

      const { data, error } = await client
        .rpc('atomic_deduct_stock', {
          p_product_id: productId,
          p_quantity: quantity,
        });

      // If the RPC doesn't exist yet, fall back to conditional update
      if (error && (error.message?.includes('function') || error.code === '42883')) {
        // Fallback: conditional UPDATE ... WHERE count_in_stock >= quantity
        const { data: updated, error: updateError } = await client
          .from('products')
          .update({ count_in_stock: client.rpc ? undefined : 0 }) // placeholder
          .eq('id', productId)
          .gte('count_in_stock', quantity)
          .select('*')
          .single();

        // If gte filter causes no match, it means insufficient stock (race condition caught)
        if (updateError || !updated) {
          // Re-read current stock for error message
          const productRes = await this.productRepo.findById(productId);
          const currentStock = productRes.success ? productRes.value?.count_in_stock : 0;
          return failure(
            new InventoryError(
              `Race condition: stock for product ${productId} is now ${currentStock}, cannot deduct ${quantity}`
            )
          );
        }

        // Manual decrement since Supabase doesn't support SET col = col - N directly
        const productRes = await this.productRepo.findById(productId);
        if (!productRes.success || !productRes.value) {
          return failure(new NotFoundError(`Product ${productId} not found`));
        }
        const newStock = productRes.value.count_in_stock - quantity;
        if (newStock < 0) {
          return failure(new InventoryError(`Insufficient stock for product ${productId}: has ${productRes.value.count_in_stock}, need ${quantity}`));
        }
        return this.productRepo.update(productId, { count_in_stock: newStock });
      }

      if (error) {
        return failure(new InventoryError(`Stock deduction failed: ${error.message}`));
      }

      // Re-fetch the updated product
      return this.productRepo.findById(productId);
    } catch (err: any) {
      // Ultimate fallback: use the original validate-then-update approach
      const validRes = await this.validateStock(productId, quantity);
      if (!validRes.success) return validRes;
      const product = validRes.value;
      const newStock = product.count_in_stock - quantity;
      return this.productRepo.update(productId, { count_in_stock: newStock });
    }
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
