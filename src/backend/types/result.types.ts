/**
 * Functional Result Pattern for predictable success / failure handling
 */

export interface Ok<T> {
  readonly success: true;
  readonly value: T;
  readonly error?: undefined;
}

export interface Err<E> {
  readonly success: false;
  readonly value?: undefined;
  readonly error: E;
}

export type Result<T, E = Error> = Ok<T> | Err<E>;

export function success<T>(value: T): Ok<T> {
  return { success: true, value };
}

export function failure<E>(error: E): Err<E> {
  return { success: false, error };
}

export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.success;
}

export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return !result.success;
}
