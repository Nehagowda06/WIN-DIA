import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepository, IBaseRepository } from './base.repository';
import { Order } from '../models/domain-models.types';
import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';
import { getServerClient, getAdminClient } from '../config/supabase.config';

export interface OrderRepository extends IBaseRepository<Order, string, Partial<Order>, Partial<Order>> {
  findByOrderNumber(orderNumber: string): Promise<Result<Order | null, AppError>>;
  findByUserId(userId: string): Promise<Result<Order[], AppError>>;
  findWithDetails(orderId: string): Promise<Result<Record<string, unknown> | null, AppError>>;
  createCheckoutTransaction(
    userId: string,
    orderData: Record<string, unknown>,
    orderItems: Record<string, unknown>[],
    paymentData: Record<string, unknown>,
    shipmentData: Record<string, unknown>
  ): Promise<Result<Record<string, unknown>, AppError>>;
}

export class SupabaseOrderRepository
  extends BaseRepository<Order, string, Partial<Order>, Partial<Order>>
  implements OrderRepository {
  constructor(clientOrGetter?: SupabaseClient | (() => SupabaseClient)) {
    super('orders', clientOrGetter || (() => getAdminClient()));
  }

  public async findByOrderNumber(orderNumber: string): Promise<Result<Order | null, AppError>> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('order_number', orderNumber)
        .maybeSingle();

      if (error) {
        return failure(this.handleError(error, 'findByOrderNumber'));
      }

      return success((data as Order) || null);
    } catch (err) {
      return failure(this.handleError(err, 'findByOrderNumber'));
    }
  }

  public async findByUserId(userId: string): Promise<Result<Order[], AppError>> {
    return this.findAll({ user_id: userId });
  }

  public async findWithDetails(orderId: string): Promise<Result<Record<string, unknown> | null, AppError>> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select(`
          *,
          items:order_items(*)
        `)
        .eq('id', orderId)
        .maybeSingle();

      if (error) {
        return failure(this.handleError(error, 'findWithDetails'));
      }

      return success(data || null);
    } catch (err) {
      return failure(this.handleError(err, 'findWithDetails'));
    }
  }

  public async createCheckoutTransaction(
    userId: string,
    orderData: Record<string, unknown>,
    orderItems: Record<string, unknown>[],
    paymentData: Record<string, unknown>,
    shipmentData: Record<string, unknown>
  ): Promise<Result<Record<string, unknown>, AppError>> {
    try {
      // The live WIN-DIA database uses the legacy orders/order_items schema.
      // Keep checkout compatible with it instead of calling the newer RPC,
      // whose shipment columns do not exist in the deployed database.
      const client = getAdminClient();
      const { data: order, error: orderError } = await client.from('orders').insert({
        order_number: orderData.order_number || `WIN-${Date.now()}`,
        user_id: userId,
        order_status: orderData.order_status || 'placed',
        payment_status: orderData.payment_status || 'pending',
        payment_method: orderData.payment_method || 'razorpay',
        items_price: Number(orderData.items_price || 0),
        discount_price: Number(orderData.discount_price || 0),
        tax_price: Number(orderData.tax_price || 0),
        shipping_price: Number(orderData.shipping_price || 0),
        total_price: Number(orderData.total_price || 0),
        shipping_address: orderData.shipping_address || {},
        order_notes: orderData.order_notes || null,
      }).select('*').single();

      if (orderError || !order) {
        return failure(this.handleError(orderError || new Error('Order was not created'), 'createCheckoutTransaction'));
      }

      const itemsPayload = orderItems.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        name: item.name,
        price: Number(item.price || 0),
        qty: Number(item.qty || 1),
        flavor: item.flavor || null,
        net_weight_grams: item.net_weight_grams || null,
        image: item.image || null,
      }));
      const { data: items, error: itemsError } = await client.from('order_items').insert(itemsPayload).select('*');
      if (itemsError) {
        await client.from('orders').delete().eq('id', order.id);
        return failure(this.handleError(itemsError, 'createCheckoutTransaction'));
      }

      const { data: shipment, error: shipmentError } = await client.from('shipments').insert({
        order_id: order.id,
        provider: 'nimbuspost',
        courier_name: shipmentData.courier_name || 'NimbusPost',
        status: shipmentData.status || 'created',
        raw_response: {},
      }).select('*').single();
      if (shipmentError) {
        await client.from('order_items').delete().eq('order_id', order.id);
        await client.from('orders').delete().eq('id', order.id);
        return failure(this.handleError(shipmentError, 'createCheckoutTransaction'));
      }

      let payment: Record<string, unknown> | null = null;
      if (paymentData.payment_method === 'cod') {
        const { data: codPayment, error: paymentError } = await client.from('payments').insert({
          order_id: order.id,
          payment_provider: 'cod',
          transaction_id: null,
          provider_order_id: null,
          amount: Number(paymentData.amount || 0),
          currency: paymentData.currency || 'INR',
          status: 'pending',
          payment_method: 'cod',
          raw_response: {},
        }).select('*').single();
        if (paymentError) {
          await client.from('shipments').delete().eq('id', shipment.id);
          await client.from('order_items').delete().eq('order_id', order.id);
          await client.from('orders').delete().eq('id', order.id);
          return failure(this.handleError(paymentError, 'createCheckoutTransaction'));
        }
        payment = codPayment as Record<string, unknown>;
      }

      return success({ order, items: items || [], payment, shipment });
    } catch (err) {
      return failure(this.handleError(err, 'createCheckoutTransaction'));
    }
  }
}
