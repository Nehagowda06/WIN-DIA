import { SupabaseClient } from '@supabase/supabase-js';
import { Result, failure, success } from '../types/result.types';
import { AppError } from '../errors/app-error';
import { ErrorCode, HttpStatus } from '../constants/http-status.constants';
import { getServerClient } from '../config/supabase.config';
import { logger } from '../utils/logger.util';
import { calculatePagination } from '../utils/pagination.util';

/**
 * Generic Base Repository Interface
 */
export interface IBaseRepository<T, ID = string, CreateDTO = Partial<T>, UpdateDTO = Partial<T>> {
  findById(id: ID): Promise<Result<T | null, AppError>>;
  findAll(filter?: Record<string, unknown>): Promise<Result<T[], AppError>>;
  findWithPagination(
    page?: number,
    pageSize?: number,
    filter?: Record<string, unknown>,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  ): Promise<Result<{ items: T[]; total: number }, AppError>>;
  create(data: CreateDTO): Promise<Result<T, AppError>>;
  update(id: ID, data: UpdateDTO): Promise<Result<T, AppError>>;
  delete(id: ID): Promise<Result<boolean, AppError>>;
}

/**
 * Abstract Supabase Base Repository Implementation
 * Encapsulates common Supabase database CRUD operations, joins, filtering, and error handling.
 */
export abstract class BaseRepository<T extends { id?: string }, ID = string, CreateDTO = Partial<T>, UpdateDTO = Partial<T>>
  implements IBaseRepository<T, ID, CreateDTO, UpdateDTO> {
  protected readonly tableName: string;
  protected getClient: () => SupabaseClient;

  constructor(tableName: string, clientGetter: () => SupabaseClient = () => getServerClient()) {
    this.tableName = tableName;
    this.getClient = clientGetter;
  }

  /**
   * Helper to format Supabase errors into AppError
   */
  protected handleError(error: unknown, action: string): AppError {
    const message = error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Database operation failed';
    logger.error(`[Repository Error] ${this.tableName}.${action}: ${message}`, error);
    return new AppError(
      `Database error during ${action} on ${this.tableName}: ${message}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
      ErrorCode.INTERNAL_SERVER_ERROR,
      true,
      error
    );
  }

  /**
   * Find record by ID
   */
  public async findById(id: ID): Promise<Result<T | null, AppError>> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('id', id as unknown as string)
        .maybeSingle();

      if (error) {
        return failure(this.handleError(error, 'findById'));
      }

      return success((data as T) || null);
    } catch (err) {
      return failure(this.handleError(err, 'findById'));
    }
  }

  /**
   * Find all records with optional equality filters
   */
  public async findAll(filter?: Record<string, unknown>): Promise<Result<T[], AppError>> {
    try {
      const client = this.getClient();
      let query = client.from(this.tableName).select('*');

      if (filter) {
        for (const [key, value] of Object.entries(filter)) {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        }
      }

      const { data, error } = await query;

      if (error) {
        return failure(this.handleError(error, 'findAll'));
      }

      return success((data as T[]) || []);
    } catch (err) {
      return failure(this.handleError(err, 'findAll'));
    }
  }

  /**
   * Paginated record query with filtering and sorting
   */
  public async findWithPagination(
    page?: number,
    pageSize?: number,
    filter?: Record<string, unknown>,
    sortBy: string = 'created_at',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<Result<{ items: T[]; total: number }, AppError>> {
    try {
      const { offset, limit } = calculatePagination(page, pageSize);
      const client = this.getClient();

      let query = client.from(this.tableName).select('*', { count: 'exact' });

      if (filter) {
        for (const [key, value] of Object.entries(filter)) {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        }
      }

      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      query = query.range(offset, offset + limit - 1);

      const { data, count, error } = await query;

      if (error) {
        return failure(this.handleError(error, 'findWithPagination'));
      }

      return success({
        items: (data as T[]) || [],
        total: count || 0,
      });
    } catch (err) {
      return failure(this.handleError(err, 'findWithPagination'));
    }
  }

  /**
   * Create a new record
   */
  public async create(data: CreateDTO): Promise<Result<T, AppError>> {
    try {
      const client = this.getClient();
      const { data: created, error } = await client
        .from(this.tableName)
        .insert(data as any)
        .select('*')
        .single();

      if (error) {
        return failure(this.handleError(error, 'create'));
      }

      return success(created as T);
    } catch (err) {
      return failure(this.handleError(err, 'create'));
    }
  }

  /**
   * Update record by ID
   */
  public async update(id: ID, data: UpdateDTO): Promise<Result<T, AppError>> {
    try {
      const client = this.getClient();
      const { data: updated, error } = await client
        .from(this.tableName)
        .update(data as any)
        .eq('id', id as unknown as string)
        .select('*')
        .single();

      if (error) {
        return failure(this.handleError(error, 'update'));
      }

      return success(updated as T);
    } catch (err) {
      return failure(this.handleError(err, 'update'));
    }
  }

  /**
   * Delete record by ID
   */
  public async delete(id: ID): Promise<Result<boolean, AppError>> {
    try {
      const client = this.getClient();
      const { error } = await client
        .from(this.tableName)
        .delete()
        .eq('id', id as unknown as string);

      if (error) {
        return failure(this.handleError(error, 'delete'));
      }

      return success(true);
    } catch (err) {
      return failure(this.handleError(err, 'delete'));
    }
  }
}
