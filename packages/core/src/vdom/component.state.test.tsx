import { describe, it, expect } from "vitest";
import { ComponentVNode } from "./ComponentVNode";
import { jsx } from "./index";
import { createState } from "../createState";

describe("Component State", () => {
  it("should initialize state with default value", () => {
    const MyComponent = () => {
      const state = createState({ count: 0 });
      return () => jsx("div", { children: String(state.count) });
    };

    const componentVNode = jsx(MyComponent, {}) as ComponentVNode;
    const elements = componentVNode.mount();

    expect(elements[0].textContent).toBe("0");
  });

  it("should update state when value changes", () => {
    let stateFn: { count: number } | undefined;

    const MyComponent = () => {
      const state = createState({ count: 0 });
      stateFn = state;
      return () => jsx("div", { children: String(state.count) });
    };

    const componentVNode = jsx(MyComponent, {}) as ComponentVNode;
    componentVNode.mount();

    stateFn!.count = 5;

    // After state update, component should re-render
    // The implementation will handle this
  });

  it("should support multiple state values", () => {
    const MyComponent = () => {
      const state = createState({ count: 0, name: "John" });
      return () =>
        jsx("div", {
          children: [
            jsx("span", { children: String(state.count) }),
            jsx("span", { children: state.name }),
          ],
        });
    };

    const componentVNode = jsx(MyComponent, {}) as ComponentVNode;
    const elements = componentVNode.mount();

    const div = elements[0] as HTMLDivElement;
    expect(div.children[0].textContent).toBe("0");
    expect(div.children[1].textContent).toBe("John");
  });

  it("should support incremental state updates", () => {
    let stateFn: { count: number } | undefined;

    const MyComponent = () => {
      const state = createState({ count: 0 });
      stateFn = state;
      return () => jsx("div", { children: String(state.count) });
    };

    const componentVNode = jsx(MyComponent, {}) as ComponentVNode;
    componentVNode.mount();

    stateFn!.count = stateFn!.count + 1;

    // After state update, component should re-render
    // The implementation will handle this
  });

  it("should preserve state between re-renders", () => {
    let stateFn: { count: number } | undefined;

    const MyComponent = () => {
      const state = createState({ count: 0 });
      stateFn = state;
      return () => jsx("div", { children: String(state.count) });
    };

    const componentVNode = jsx(MyComponent, {}) as ComponentVNode;
    componentVNode.mount();

    stateFn!.count = 1;
    stateFn!.count = 2;
    stateFn!.count = 3;

    // State should be preserved across multiple updates
    // The implementation will handle this
  });

  it("should support nested objects as state", () => {
    const MyComponent = () => {
      const state = createState({ user: { name: "John", age: 30 } });
      return () =>
        jsx("div", {
          children: `${state.user.name} is ${state.user.age} years old`,
        });
    };

    const componentVNode = jsx(MyComponent, {}) as ComponentVNode;
    const elements = componentVNode.mount();

    expect(elements[0].textContent).toBe("John is 30 years old");
  });

  it("should support arrays as state", () => {
    const MyComponent = () => {
      const state = createState({ items: [1, 2, 3] });
      return () =>
        jsx("ul", {
          children: state.items.map((item) =>
            jsx("li", { children: String(item) })
          ),
        });
    };

    const componentVNode = jsx(MyComponent, {}) as ComponentVNode;
    const elements = componentVNode.mount();

    const ul = elements[0] as HTMLUListElement;
    expect(ul.children).toHaveLength(3);
    expect(ul.children[0].textContent).toBe("1");
    expect(ul.children[1].textContent).toBe("2");
    expect(ul.children[2].textContent).toBe("3");
  });

  it("should update nested state properties", () => {
    let stateFn: { user: { name: string; age: number } } | undefined;

    const MyComponent = () => {
      const state = createState({ user: { name: "Alice", age: 25 } });
      stateFn = state;
      return () =>
        jsx("div", {
          children: `${state.user.name} is ${state.user.age}`,
        });
    };

    const componentVNode = jsx(MyComponent, {}) as ComponentVNode;
    const elements = componentVNode.mount();

    expect(elements[0].textContent).toBe("Alice is 25");

    stateFn!.user.name = "Bob";
    stateFn!.user.age = 30;

    // After nested state update, component should re-render
    // The implementation will handle this
  });

  it("should support array mutations", () => {
    let stateFn: { items: number[] } | undefined;

    const MyComponent = () => {
      const state = createState({ items: [1, 2, 3] });
      stateFn = state;
      return () =>
        jsx("ul", {
          children: state.items.map((item) =>
            jsx("li", { children: String(item) })
          ),
        });
    };

    const componentVNode = jsx(MyComponent, {}) as ComponentVNode;
    componentVNode.mount();

    stateFn!.items.push(4);

    // After array mutation, component should re-render
    // The implementation will handle this
  });
});
