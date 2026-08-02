import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';
import { InventoryError, NotFoundError } from '../errors/domain-errors';
import { ProductVariant } from '../models/domain-models.types';
import { ProductVariantRepository } from '../repositories/product-variant.repository';
import { logger } from '../utils/logger.util';
import { container, RepositoryTokens } from '../providers/container.provider';

export interface InventoryService {
  validateStock(variantId: string, requiredQuantity: number): Promise<Result<ProductVariant, AppError>>;
  deductStockAfterSuccessfulPayment(variantId: string, quantity: number): Promise<Result<ProductVariant, AppError>>;
  restoreStockAfterCancellation(variantId: string, quantity: number): Promise<Result<ProductVariant, AppError>>;
}

export class InventoryServiceImpl implements InventoryService {
  private variantRepo: ProductVariantRepository;

  constructor(variantRepo?: ProductVariantRepository) {
    this.variantRepo = variantRepo || container.resolve<ProductVariantRepository>(RepositoryTokens.ProductVariantRepository);
  }

  public async validateStock(variantId: string, requiredQuantity: number): Promise<Result<ProductVariant, AppError>> {
    const variantRes = await this.variantRepo.findById(variantId);
    if (!variantRes.success) return variantRes;
    if (!variantRes.value || !variantRes.value.is_active) {
      return failure(new NotFoundError(`Variant ID ${variantId} is invalid or inactive`));
    }

    const variant = variantRes.value;
    if (variant.stock_quantity < requiredQuantity) {
      logger.warn(`[InventoryService] Low stock for variant ${variant.sku}: requested ${requiredQuantity}, available ${variant.stock_quantity}`);
      return failure(new InventoryError(`Insufficient inventory for "${variant.name}". Available stock: ${variant.stock_quantity}`));
    }

    return success(variant);
  }

  public async deductStockAfterSuccessfulPayment(variantId: string, quantity: number): Promise<Result<ProductVariant, AppError>> {
    logger.info(`[InventoryService] Deducting ${quantity} stock for variant ${variantId} after payment`);
    const validRes = await this.validateStock(variantId, quantity);
    if (!validRes.success) return validRes;

    const variant = validRes.value;
    const newStock = variant.stock_quantity - quantity;
    return this.variantRepo.update(variantId, { stock_quantity: newStock });
  }

  public async restoreStockAfterCancellation(variantId: string, quantity: number): Promise<Result<ProductVariant, AppError>> {
    logger.info(`[InventoryService] Restoring ${quantity} stock for variant ${variantId} after cancellation`);
    const variantRes = await this.variantRepo.findById(variantId);
    if (!variantRes.success) return variantRes;
    if (!variantRes.value) {
      return failure(new NotFoundError(`Variant ID ${variantId} not found to restore stock`));
    }

    const newStock = variantRes.value.stock_quantity + quantity;
    return this.variantRepo.update(variantId, { stock_quantity: newStock });
  }
}
