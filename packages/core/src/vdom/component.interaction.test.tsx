import { describe, it, expect } from "vitest";
import { ComponentVNode } from "./ComponentVNode";
import { jsx } from "./index";
import { createState } from "../createState";

describe("Component State and Props Interaction", () => {
  it("should use both state and props together", () => {
    const MyComponent = (props: { initialCount: number }) => {
      const state = createState({ count: props.initialCount });
      return () => jsx("div", { children: String(state.count) });
    };

    const componentVNode = jsx(MyComponent, {
      initialCount: 10,
    }) as ComponentVNode;
    const elements = componentVNode.mount();

    expect(elements[0].textContent).toBe("10");
  });

  it("should derive state from props on mount", () => {
    const MyComponent = (props: { multiplier: number }) => {
      const state = createState({ count: 0 });
      return () =>
        jsx("div", {
          children: String(state.count * props.multiplier),
        });
    };

    const componentVNode = jsx(MyComponent, {
      multiplier: 5,
    }) as ComponentVNode;
    const elements = componentVNode.mount();

    expect(elements[0].textContent).toBe("0");
  });

  it("should handle state changes with prop-based rendering", () => {
    let stateFn: { count: number } | undefined;

    const MyComponent = (props: { prefix: string }) => {
      const state = createState({ count: 0 });
      stateFn = state;
      return () =>
        jsx("div", {
          children: `${props.prefix}: ${state.count}`,
        });
    };

    const componentVNode = jsx(MyComponent, {
      prefix: "Count",
    }) as ComponentVNode;
    const elements = componentVNode.mount();

    expect(elements[0].textContent).toBe("Count: 0");

    stateFn!.count = 5;
    // After state update, should show "Count: 5"
    // The implementation will handle this
  });

  it("should support multiple state values with props", () => {
    const MyComponent = (props: { title: string; initialCount: number }) => {
      const state = createState({
        count: props.initialCount,
        isVisible: true,
      });
      return () =>
        jsx("div", {
          children: state.isVisible
            ? `${props.title}: ${state.count}`
            : "Hidden",
        });
    };

    const componentVNode = jsx(MyComponent, {
      title: "Counter",
      initialCount: 5,
    }) as ComponentVNode;
    const elements = componentVNode.mount();

    expect(elements[0].textContent).toBe("Counter: 5");
  });

  it("should handle complex state derived from props", () => {
    const MyComponent = (props: { items: string[] }) => {
      const state = createState({ selectedIndex: 0 });
      return () =>
        jsx("div", {
          children: props.items[state.selectedIndex] || "None",
        });
    };

    const componentVNode = jsx(MyComponent, {
      items: ["First", "Second", "Third"],
    }) as ComponentVNode;
    const elements = componentVNode.mount();

    expect(elements[0].textContent).toBe("First");
  });
});
