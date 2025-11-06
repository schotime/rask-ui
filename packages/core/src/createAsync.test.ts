import { describe, it, expect } from 'vitest';
import { createAsync } from './createAsync';

describe('createAsync', () => {
  it('should start in pending state', () => {
    const promise = new Promise(() => {});
    const async = createAsync(promise);

    expect(async.isPending).toBe(true);
    expect(async.value).toBeNull();
    expect(async.error).toBeNull();
  });

  it('should resolve to value state on success', async () => {
    const promise = Promise.resolve('success');
    const async = createAsync(promise);

    expect(async.isPending).toBe(true);

    await promise;

    // Wait for state update
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(async.isPending).toBe(false);
    expect(async.value).toBe('success');
    expect(async.error).toBeNull();
  });

  it('should resolve to error state on rejection', async () => {
    const promise = Promise.reject(new Error('failed'));
    const async = createAsync(promise);

    expect(async.isPending).toBe(true);

    try {
      await promise;
    } catch {
      // Ignore
    }

    // Wait for state update
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(async.isPending).toBe(false);
    expect(async.value).toBeNull();
    expect(async.error).toContain('failed');
  });

  it('should handle numeric values', async () => {
    const promise = Promise.resolve(42);
    const async = createAsync(promise);

    await promise;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(async.value).toBe(42);
  });

  it('should handle object values', async () => {
    const data = { id: 1, name: 'Test' };
    const promise = Promise.resolve(data);
    const async = createAsync(promise);

    await promise;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(async.value).toEqual(data);
  });

  it('should handle array values', async () => {
    const data = [1, 2, 3, 4, 5];
    const promise = Promise.resolve(data);
    const async = createAsync(promise);

    await promise;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(async.value).toEqual(data);
  });

  it('should convert error to string', async () => {
    const promise = Promise.reject('string error');
    const async = createAsync(promise);

    try {
      await promise;
    } catch {
      // Ignore
    }

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(typeof async.error).toBe('string');
    expect(async.error).toBe('string error');
  });

  it('should handle error objects', async () => {
    const error = new Error('Something went wrong');
    const promise = Promise.reject(error);
    const async = createAsync(promise);

    try {
      await promise;
    } catch {
      // Ignore
    }

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(async.error).toContain('Something went wrong');
  });

  it('should create reactive state', async () => {
    const promise = new Promise((resolve) => {
      setTimeout(() => resolve('delayed'), 10);
    });
    const async = createAsync(promise);

    expect(async.isPending).toBe(true);

    await promise;
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(async.isPending).toBe(false);
    expect(async.value).toBe('delayed');
  });

  it('should handle immediate resolution', async () => {
    const async = createAsync(Promise.resolve('immediate'));

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(async.isPending).toBe(false);
    expect(async.value).toBe('immediate');
  });

  it('should handle immediate rejection', async () => {
    const async = createAsync(Promise.reject('immediate error'));

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(async.isPending).toBe(false);
    expect(async.error).toBe('immediate error');
  });
});
