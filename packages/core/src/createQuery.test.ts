import { describe, it, expect, vi } from 'vitest';
import { createQuery } from './createQuery';

describe('createQuery', () => {
  it('should start in pending state and fetch immediately', async () => {
    const fetcher = vi.fn(() => Promise.resolve('data'));
    const query = createQuery(fetcher);

    expect(query.isPending).toBe(true);
    expect(query.data).toBeNull();
    expect(query.error).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(1);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(query.isPending).toBe(false);
    expect(query.data).toBe('data');
  });

  it('should resolve to data state on success', async () => {
    const fetcher = () => Promise.resolve({ id: 1, name: 'Test' });
    const query = createQuery(fetcher);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(query.isPending).toBe(false);
    expect(query.data).toEqual({ id: 1, name: 'Test' });
    expect(query.error).toBeNull();
  });

  it('should resolve to error state on failure', async () => {
    const fetcher = () => Promise.reject(new Error('Network error'));
    const query = createQuery(fetcher);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(query.isPending).toBe(false);
    expect(query.data).toBeNull();
    expect(query.error).toContain('Network error');
  });

  it('should allow manual refetch', async () => {
    const fetcher = vi.fn(() => Promise.resolve('data'));
    const query = createQuery(fetcher);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(fetcher).toHaveBeenCalledTimes(1);

    query.fetch();

    expect(query.isPending).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(query.isPending).toBe(false);
  });

  it('should retain old data during refetch by default', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce('data1')
      .mockResolvedValueOnce('data2');

    const query = createQuery(fetcher);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(query.data).toBe('data1');

    query.fetch();

    expect(query.isPending).toBe(true);
    expect(query.data).toBe('data1'); // Old data retained

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(query.data).toBe('data2');
  });

  it('should clear old data when force refetch is used', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce('data1')
      .mockResolvedValueOnce('data2');

    const query = createQuery(fetcher);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(query.data).toBe('data1');

    query.fetch(true); // Force refresh

    expect(query.isPending).toBe(true);
    expect(query.data).toBeNull(); // Old data cleared

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(query.data).toBe('data2');
  });

  it('should cancel previous request on new fetch', async () => {
    let resolveFirst: (value: string) => void;
    let resolveSecond: (value: string) => void;

    const firstPromise = new Promise<string>((resolve) => {
      resolveFirst = resolve;
    });
    const secondPromise = new Promise<string>((resolve) => {
      resolveSecond = resolve;
    });

    const fetcher = vi
      .fn()
      .mockReturnValueOnce(firstPromise)
      .mockReturnValueOnce(secondPromise);

    const query = createQuery(fetcher);

    expect(query.isPending).toBe(true);

    // Trigger second fetch before first completes
    query.fetch();

    // Resolve first (should be ignored due to cancellation)
    resolveFirst!('first');
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(query.data).toBeNull(); // First result ignored

    // Resolve second
    resolveSecond!('second');
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(query.data).toBe('second');
  });

  it('should handle rapid successive fetches', async () => {
    let counter = 0;
    const fetcher = vi.fn(() => Promise.resolve(`data-${++counter}`));
    const query = createQuery(fetcher);

    await new Promise((resolve) => setTimeout(resolve, 10));

    // Rapid fetches
    query.fetch();
    query.fetch();
    query.fetch();

    await new Promise((resolve) => setTimeout(resolve, 20));

    // Only the last fetch should matter
    expect(fetcher).toHaveBeenCalledTimes(4); // Initial + 3 fetches
    expect(query.data).toBe('data-4');
  });

  it('should cancel on error and allow refetch', async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error('First error'))
      .mockResolvedValueOnce('success');

    const query = createQuery(fetcher);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(query.error).toContain('First error');
    expect(query.data).toBeNull();

    query.fetch();

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(query.error).toBeNull();
    expect(query.data).toBe('success');
  });

  it('should handle AbortController cancellation correctly', async () => {
    const abortedPromise = new Promise((_, reject) => {
      const error = new Error('Aborted');
      error.name = 'AbortError';
      setTimeout(() => reject(error), 5);
    });

    const successPromise = Promise.resolve('success');

    const fetcher = vi
      .fn()
      .mockReturnValueOnce(abortedPromise)
      .mockReturnValueOnce(successPromise);

    const query = createQuery(fetcher);

    // Immediately trigger second fetch to abort first
    query.fetch();

    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(query.data).toBe('success');
    expect(query.error).toBeNull();
  });

  it('should expose reactive getters', async () => {
    const fetcher = () => Promise.resolve('data');
    const query = createQuery(fetcher);

    // Access getters
    const pending1 = query.isPending;
    const data1 = query.data;
    const error1 = query.error;

    expect(pending1).toBe(true);
    expect(data1).toBeNull();
    expect(error1).toBeNull();

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(query.isPending).toBe(false);
    expect(query.data).toBe('data');
  });
});
