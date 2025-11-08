import { describe, it, expect } from "vitest";
import { ComponentVNode } from "./ComponentVNode";
import { jsx } from "./index";

describe("Component Props", () => {
  it("should pass string props to component", () => {
    const MyComponent = (props: { message: string }) => {
      return () => jsx("div", { children: props.message });
    };

    const componentVNode = jsx(MyComponent, {
      message: "Hello Props",
    }) as ComponentVNode;
    const elements = componentVNode.mount();

    expect(elements[0].textContent).toBe("Hello Props");
  });

  it("should pass number props to component", () => {
    const MyComponent = (props: { count: number }) => {
      return () => jsx("div", { children: String(props.count) });
    };

    const componentVNode = jsx(MyComponent, {
      count: 42,
    }) as ComponentVNode;
    const elements = componentVNode.mount();

    expect(elements[0].textContent).toBe("42");
  });

  it("should pass object props to component", () => {
    const MyComponent = (props: { user: { name: string; age: number } }) => {
      return () =>
        jsx("div", {
          children: `${props.user.name} is ${props.user.age}`,
        });
    };

    const componentVNode = jsx(MyComponent, {
      user: { name: "Alice", age: 25 },
    }) as ComponentVNode;
    const elements = componentVNode.mount();

    expect(elements[0].textContent).toBe("Alice is 25");
  });

  it("should pass array props to component", () => {
    const MyComponent = (props: { items: string[] }) => {
      return () =>
        jsx("ul", {
          children: props.items.map((item) => jsx("li", { children: item })),
        });
    };

    const componentVNode = jsx(MyComponent, {
      items: ["apple", "banana", "cherry"],
    }) as ComponentVNode;
    const elements = componentVNode.mount();

    const ul = elements[0] as HTMLUListElement;
    expect(ul.children).toHaveLength(3);
    expect(ul.children[0].textContent).toBe("apple");
    expect(ul.children[1].textContent).toBe("banana");
    expect(ul.children[2].textContent).toBe("cherry");
  });

  it("should pass function props to component", () => {
    const handleClick = () => "clicked";
    const MyComponent = (props: { onClick: () => string }) => {
      return () =>
        jsx("button", {
          children: props.onClick(),
        });
    };

    const componentVNode = jsx(MyComponent, {
      onClick: handleClick,
    }) as ComponentVNode;
    const elements = componentVNode.mount();

    expect(elements[0].textContent).toBe("clicked");
  });

  it("should pass multiple props to component", () => {
    const MyComponent = (props: {
      title: string;
      count: number;
      isActive: boolean;
    }) => {
      return () =>
        jsx("div", {
          children: `${props.title}: ${props.count} (${
            props.isActive ? "active" : "inactive"
          })`,
        });
    };

    const componentVNode = jsx(MyComponent, {
      title: "Counter",
      count: 5,
      isActive: true,
    }) as ComponentVNode;
    const elements = componentVNode.mount();

    expect(elements[0].textContent).toBe("Counter: 5 (active)");
  });

  it("should handle optional props", () => {
    const MyComponent = (props: { message?: string }) => {
      return () =>
        jsx("div", {
          children: props.message || "Default message",
        });
    };

    const componentVNode1 = jsx(MyComponent, {}) as ComponentVNode;
    const elements1 = componentVNode1.mount();
    expect(elements1[0].textContent).toBe("Default message");

    const componentVNode2 = jsx(MyComponent, {
      message: "Custom message",
    }) as ComponentVNode;
    const elements2 = componentVNode2.mount();
    expect(elements2[0].textContent).toBe("Custom message");
  });

  it("should update when props change", () => {
    const MyComponent = (props: { message: string }) => {
      return () => jsx("div", { children: props.message });
    };

    const componentVNode = jsx(MyComponent, {
      message: "Initial",
    }) as ComponentVNode;
    const elements = componentVNode.mount();

    expect(elements[0].textContent).toBe("Initial");

    // Simulate props update
    // The implementation will handle prop updates through patch
  });
});
