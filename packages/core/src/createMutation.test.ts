import { describe, it, expect, vi } from 'vitest';
import { createMutation } from './createMutation';

describe('createMutation', () => {
  it('should start in idle state', () => {
    const mutator = vi.fn(() => Promise.resolve(null));
    const mutation = createMutation(mutator);

    expect(mutation.isPending).toBe(false);
    expect(mutation.params).toBeNull();
    expect(mutation.error).toBeNull();
    expect(mutator).not.toHaveBeenCalled();
  });

  it('should execute mutator when mutate is called', async () => {
    const mutator = vi.fn((params: string) => Promise.resolve(params));
    const mutation = createMutation(mutator);

    mutation.mutate('test');

    expect(mutation.isPending).toBe(true);
    expect(mutation.params).toBe('test');
    expect(mutator).toHaveBeenCalledWith('test');

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(mutation.isPending).toBe(false);
    expect(mutation.params).toBeNull();
  });

  it('should handle successful mutations', async () => {
    const mutator = (params: { id: number }) => Promise.resolve(params);
    const mutation = createMutation(mutator);

    mutation.mutate({ id: 1 });

    expect(mutation.isPending).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(mutation.isPending).toBe(false);
    expect(mutation.error).toBeNull();
    expect(mutation.params).toBeNull();
  });

  it('should handle mutation errors', async () => {
    const mutator = (params: string) => Promise.reject(new Error('Mutation failed'));
    const mutation = createMutation(mutator);

    mutation.mutate('test');

    expect(mutation.isPending).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(mutation.isPending).toBe(false);
    expect(mutation.error).toContain('Mutation failed');
    expect(mutation.params).toBeNull();
  });

  it('should cancel previous mutation on new mutate call', async () => {
    let resolveFirst: (value: string) => void;
    let resolveSecond: (value: string) => void;

    const firstPromise = new Promise<string>((resolve) => {
      resolveFirst = resolve;
    });
    const secondPromise = new Promise<string>((resolve) => {
      resolveSecond = resolve;
    });

    const mutator = vi
      .fn()
      .mockReturnValueOnce(firstPromise)
      .mockReturnValueOnce(secondPromise);

    const mutation = createMutation(mutator);

    mutation.mutate('first' as any);
    expect(mutation.params).toBe('first');

    // Trigger second mutation before first completes
    mutation.mutate('second' as any);
    expect(mutation.params).toBe('second');

    // Resolve first (should be ignored due to cancellation)
    resolveFirst!('first');
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(mutation.isPending).toBe(true); // Still pending second

    // Resolve second
    resolveSecond!('second');
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(mutation.isPending).toBe(false);
    expect(mutation.params).toBeNull();
  });

  it('should handle rapid successive mutations', async () => {
    let counter = 0;
    const mutator = vi.fn(() => Promise.resolve(++counter));
    const mutation = createMutation(mutator);

    // Rapid mutations
    mutation.mutate('1' as any);
    mutation.mutate('2' as any);
    mutation.mutate('3' as any);

    await new Promise((resolve) => setTimeout(resolve, 20));

    // Only the last mutation should complete
    expect(mutator).toHaveBeenCalledTimes(3);
    expect(mutation.isPending).toBe(false);
    expect(mutation.params).toBeNull();
  });

  it('should clear error on successful retry', async () => {
    const mutator = vi
      .fn()
      .mockRejectedValueOnce(new Error('First error'))
      .mockResolvedValueOnce('success');

    const mutation = createMutation(mutator);

    mutation.mutate('attempt1' as any);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(mutation.error).toContain('First error');

    mutation.mutate('attempt2' as any);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(mutation.error).toBeNull();
    expect(mutation.isPending).toBe(false);
  });

  it('should handle different parameter types', async () => {
    const mutator = vi.fn((params) => Promise.resolve(params));
    const mutation = createMutation(mutator);

    // Object params
    mutation.mutate({ id: 1, name: 'test' });
    expect(mutation.params).toEqual({ id: 1, name: 'test' });

    await new Promise((resolve) => setTimeout(resolve, 10));

    // Array params
    const mutation2 = createMutation(mutator);
    mutation2.mutate([1, 2, 3] as any);
    expect(mutation2.params).toEqual([1, 2, 3]);

    await new Promise((resolve) => setTimeout(resolve, 10));

    // String params
    const mutation3 = createMutation(mutator);
    mutation3.mutate('string' as any);
    expect(mutation3.params).toBe('string');
  });

  it('should convert errors to strings', async () => {
    const mutator = (params: string) => Promise.reject('string error');
    const mutation = createMutation(mutator);

    mutation.mutate('test');

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(typeof mutation.error).toBe('string');
    expect(mutation.error).toBe('string error');
  });

  it('should handle AbortController cancellation correctly', async () => {
    const abortedPromise = new Promise((_, reject) => {
      const error = new Error('Aborted');
      error.name = 'AbortError';
      setTimeout(() => reject(error), 5);
    });

    const successPromise = Promise.resolve('success');

    const mutator = vi
      .fn()
      .mockReturnValueOnce(abortedPromise)
      .mockReturnValueOnce(successPromise);

    const mutation = createMutation(mutator);

    mutation.mutate('first' as any);

    // Immediately trigger second mutation to abort first
    mutation.mutate('second' as any);

    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(mutation.isPending).toBe(false);
    expect(mutation.error).toBeNull();
  });

  it('should track params during pending state', () => {
    const mutator = () =>
      new Promise((resolve) => setTimeout(() => resolve(null), 100));
    const mutation = createMutation(mutator);

    const params = { id: 123, action: 'update' };
    mutation.mutate(params);

    expect(mutation.isPending).toBe(true);
    expect(mutation.params).toEqual(params);
  });

  it('should expose reactive getters', async () => {
    const mutator = () => Promise.resolve('data');
    const mutation = createMutation(mutator);

    // Access getters before mutation
    expect(mutation.isPending).toBe(false);
    expect(mutation.params).toBeNull();
    expect(mutation.error).toBeNull();

    mutation.mutate('test' as any);

    // Access getters during mutation
    expect(mutation.isPending).toBe(true);
    expect(mutation.params).toBe('test');

    await new Promise((resolve) => setTimeout(resolve, 10));

    // Access getters after mutation
    expect(mutation.isPending).toBe(false);
    expect(mutation.params).toBeNull();
  });
});
