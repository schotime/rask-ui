import { describe, it, expect, vi } from 'vitest';
import { onMount, onCleanup, getCurrentComponent } from './component';
import { renderComponent } from './test-setup';
import { createState } from './createState';

describe('Component Lifecycle', () => {
  it('should call onMount after component is mounted', async () => {
    const mountCallback = vi.fn();

    function TestComponent() {
      onMount(mountCallback);
      return () => <div>Test</div>;
    }

    const { unmount } = renderComponent(<TestComponent />);

    // onMount is called in insert hook, which happens after initial render
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mountCallback).toHaveBeenCalledTimes(1);

    unmount();
  });

  it('should call onCleanup when component is destroyed', async () => {
    const cleanupCallback = vi.fn();

    function TestComponent() {
      onCleanup(cleanupCallback);
      return () => <div>Test</div>;
    }

    const { rerender, unmount } = renderComponent(<TestComponent />);

    await new Promise((resolve) => setTimeout(resolve, 0));

    // Unmount by rendering empty div
    rerender(<div />);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(cleanupCallback).toHaveBeenCalledTimes(1);

    unmount();
  });

  it('should allow multiple onMount callbacks', async () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    function TestComponent() {
      onMount(callback1);
      onMount(callback2);
      return () => <div>Test</div>;
    }

    const { unmount } = renderComponent(<TestComponent />);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);

    unmount();
  });

  it('should allow multiple onCleanup callbacks', async () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    function TestComponent() {
      onCleanup(callback1);
      onCleanup(callback2);
      return () => <div>Test</div>;
    }

    const { rerender, unmount } = renderComponent(<TestComponent />);

    await new Promise((resolve) => setTimeout(resolve, 0));

    // Unmount by rendering empty div
    rerender(<div />);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);

    unmount();
  });

  it('should throw error when onMount is called outside component setup', () => {
    expect(() => {
      onMount(() => {});
    }).toThrow('Only use onMount in component setup');
  });

  it('should throw error when onCleanup is called outside component setup', () => {
    expect(() => {
      onCleanup(() => {});
    }).toThrow('Only use onCleanup in component setup');
  });

  it('should have access to component instance via getCurrentComponent', () => {
    let componentInstance: any = null;

    function TestComponent() {
      componentInstance = getCurrentComponent();
      return () => <div>Test</div>;
    }

    const { unmount } = renderComponent(<TestComponent />);

    expect(componentInstance).not.toBeNull();
    expect(componentInstance).toHaveProperty('component');
    expect(componentInstance).toHaveProperty('observer');

    unmount();
  });

  it('should re-render when reactive state changes', async () => {
    let renderCount = 0;

    function Counter() {
      const state = createState({ count: 0 });

      onMount(() => {
        setTimeout(() => {
          state.count = 1;
        }, 10);
      });

      return () => {
        renderCount++;
        return <div>{state.count}</div>;
      };
    }

    const { container, unmount } = renderComponent(<Counter />);

    expect(renderCount).toBe(1);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(renderCount).toBe(2);
    expect(container.textContent).toContain('1');

    unmount();
  });

  it('should handle props reactively', async () => {
    function Child(props: { value: number }) {
      return () => <div>{props.value}</div>;
    }

    function Parent() {
      const state = createState({ value: 0 });

      onMount(() => {
        setTimeout(() => {
          state.value = 42;
        }, 10);
      });

      return () => <Child value={state.value} />;
    }

    const { container, unmount } = renderComponent(<Parent />);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(container.textContent).toContain('42');

    unmount();
  });

  it('should maintain parent-child component relationship', () => {
    let parentComponent: any = null;
    let childComponent: any = null;

    function Child() {
      childComponent = getCurrentComponent();
      return () => <div>Child</div>;
    }

    function Parent() {
      parentComponent = getCurrentComponent();
      return () => <Child />;
    }

    const { unmount } = renderComponent(<Parent />);

    expect(childComponent).not.toBeNull();
    expect(parentComponent).not.toBeNull();
    expect(childComponent.parent).toBe(parentComponent);

    unmount();
  });
});
