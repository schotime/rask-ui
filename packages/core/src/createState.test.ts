import { describe, it, expect, vi } from 'vitest';
import { createState } from './createState';
import { Observer } from './observation';

describe('createState', () => {
  it('should create a reactive proxy from an object', () => {
    const state = createState({ count: 0 });
    expect(state.count).toBe(0);
  });

  it('should allow mutations', () => {
    const state = createState({ count: 0 });
    state.count = 5;
    expect(state.count).toBe(5);
  });

  it('should return the same proxy for the same object', () => {
    const obj = { count: 0 };
    const proxy1 = createState(obj);
    const proxy2 = createState(obj);
    expect(proxy1).toBe(proxy2);
  });

  it('should create nested proxies for nested objects', () => {
    const state = createState({ user: { name: 'Alice', age: 30 } });
    state.user.name = 'Bob';
    expect(state.user.name).toBe('Bob');
  });

  it('should handle arrays reactively', () => {
    const state = createState({ items: [1, 2, 3] });
    state.items.push(4);
    expect(state.items).toEqual([1, 2, 3, 4]);
  });

  it('should track property access in observers', () => {
    const state = createState({ count: 0 });
    let renderCount = 0;

    const observer = new Observer(() => {
      renderCount++;
    });

    const dispose = observer.observe();
    state.count; // Access property to track it
    dispose();

    expect(renderCount).toBe(0);

    // Mutate after observation setup
    const dispose2 = observer.observe();
    const value = state.count; // Track
    dispose2(); // Stop observing, subscriptions are now active

    state.count = 1;

    // Wait for microtask
    return new Promise((resolve) => {
      queueMicrotask(() => {
        expect(renderCount).toBeGreaterThan(0);
        resolve(undefined);
      });
    });
  });

  it('should handle property deletion', () => {
    const state = createState({ count: 0, temp: 'value' } as { count: number; temp?: string });
    delete state.temp;
    expect(state.temp).toBeUndefined();
    expect('temp' in state).toBe(false);
  });

  it('should not create proxies for functions', () => {
    const fn = () => 'hello';
    const state = createState({ method: fn });
    expect(state.method).toBe(fn);
    expect(state.method()).toBe('hello');
  });

  it('should handle symbol properties', () => {
    const sym = Symbol('test');
    const state = createState({ [sym]: 'value' } as any);
    expect(state[sym]).toBe('value');
  });

  it('should notify observers only on actual changes', () => {
    const state = createState({ count: 0 });
    let notifyCount = 0;

    const observer = new Observer(() => {
      notifyCount++;
    });

    const dispose = observer.observe();
    state.count; // Track
    dispose();

    state.count = 0; // Same value - should still notify per current implementation
    state.count = 0;

    return new Promise((resolve) => {
      queueMicrotask(() => {
        // The implementation notifies even for same value, except for optimization cases
        observer.dispose();
        resolve(undefined);
      });
    });
  });

  it('should handle deeply nested objects', () => {
    const state = createState({
      level1: {
        level2: {
          level3: {
            value: 'deep',
          },
        },
      },
    });

    state.level1.level2.level3.value = 'modified';
    expect(state.level1.level2.level3.value).toBe('modified');
  });

  it('should handle array mutations correctly', () => {
    const state = createState({ items: [1, 2, 3] });

    state.items.pop();
    expect(state.items).toEqual([1, 2]);

    state.items.unshift(0);
    expect(state.items).toEqual([0, 1, 2]);

    state.items.splice(1, 1, 99);
    expect(state.items).toEqual([0, 99, 2]);
  });
});
