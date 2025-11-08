import { describe, it, expect } from "vitest";
import { ComponentVNode } from "./ComponentVNode";
import { jsx } from "./index";
import { createState } from "../createState";

describe("Component Counter", () => {
  it("should render a simple counter", () => {
    const MyComponent = () => {
      const state = createState({ count: 0 });

      return () => jsx("h1", { children: `Counter ${state.count}` });
    };

    const componentVNode = jsx(MyComponent, {}) as ComponentVNode;
    const elements = componentVNode.mount();

    expect(elements).toHaveLength(1);
    expect(elements[0].textContent).toBe("Counter 0");
  });

  it("should update counter text when state changes", async () => {
    let stateFn: { count: number } | undefined;

    const MyComponent = () => {
      const state = createState({ count: 0 });
      stateFn = state;

      return () => jsx("h1", { children: `Counter ${state.count}` });
    };

    const componentVNode = jsx(MyComponent, {}) as ComponentVNode;
    const elements = componentVNode.mount();

    expect(elements[0].textContent).toBe("Counter 0");

    // Update the counter
    stateFn!.count++;

    // Wait for reactive update
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Try to get elements after update - this might fail
    const updatedElements = componentVNode.getElements();
    expect(updatedElements).toBeDefined();
    expect(updatedElements[0].textContent).toBe("Counter 1");
  });

  it("should handle multiple counter increments", async () => {
    let stateFn: { count: number } | undefined;

    const MyComponent = () => {
      const state = createState({ count: 0 });
      stateFn = state;

      return () => jsx("h1", { children: `Counter ${state.count}` });
    };

    const componentVNode = jsx(MyComponent, {}) as ComponentVNode;
    componentVNode.mount();

    // Multiple increments
    stateFn!.count++;
    stateFn!.count++;
    stateFn!.count++;

    // Wait for reactive update
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Try to get elements
    const elements = componentVNode.getElements();
    expect(elements[0].textContent).toBe("Counter 3");
  });

  it("should handle counter with click handler", async () => {
    let stateFn: { count: number } | undefined;

    const MyComponent = () => {
      const state = createState({ count: 0 });
      stateFn = state;

      return () =>
        jsx("h1", {
          children: `Counter ${state.count}`,
          onClick: () => state.count++,
        });
    };

    const componentVNode = jsx(MyComponent, {}) as ComponentVNode;
    const elements = componentVNode.mount();

    expect(elements[0].textContent).toBe("Counter 0");

    // Simulate state change (like a click would do)
    stateFn!.count++;

    // Wait for reactive update
    await new Promise((resolve) => setTimeout(resolve, 0));

    const updatedElements = componentVNode.getElements();
    expect(updatedElements[0].textContent).toBe("Counter 1");
  });

  it("should handle counter in a div wrapper", async () => {
    let stateFn: { count: number } | undefined;

    const MyComponent = () => {
      const state = createState({ count: 0 });
      stateFn = state;

      return () =>
        jsx("div", {
          children: jsx("h1", { children: `Counter ${state.count}` }),
        });
    };

    const componentVNode = jsx(MyComponent, {}) as ComponentVNode;
    componentVNode.mount();

    stateFn!.count++;

    // Wait for reactive update
    await new Promise((resolve) => setTimeout(resolve, 0));

    // This should trigger the error
    const elements = componentVNode.getElements();
    expect(elements).toBeDefined();
  });

  it("should handle template literal with interpolated count", async () => {
    let stateFn: { count: number } | undefined;

    const MyComponent = () => {
      const state = createState({ count: 0 });
      stateFn = state;

      return () =>
        jsx("h1", {
          children: `Hello World (${state.count})`,
        });
    };

    const componentVNode = jsx(MyComponent, {}) as ComponentVNode;
    componentVNode.mount();

    stateFn!.count = 5;

    await new Promise((resolve) => setTimeout(resolve, 0));

    const elements = componentVNode.getElements();
    expect(elements[0].textContent).toBe("Hello World (5)");
  });

  it("should handle counter with nested elements", async () => {
    let stateFn: { count: number } | undefined;

    const MyComponent = () => {
      const state = createState({ count: 0 });
      stateFn = state;

      return () =>
        jsx("div", {
          children: [
            jsx("h1", { children: "Title" }),
            jsx("p", { children: `Count: ${state.count}` }),
          ],
        });
    };

    const componentVNode = jsx(MyComponent, {}) as ComponentVNode;
    componentVNode.mount();

    stateFn!.count = 42;

    await new Promise((resolve) => setTimeout(resolve, 0));

    const elements = componentVNode.getElements();
    expect(elements).toBeDefined();
  });
});
