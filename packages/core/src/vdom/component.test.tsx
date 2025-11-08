import { describe, it, expect } from "vitest";
import { ComponentVNode } from "./ComponentVNode";
import { jsx } from "./index";

describe("ComponentVNode", () => {
  it("should mount a component that returns an element", () => {
    const MyComponent = () => {
      return () => jsx("div", {});
    };

    const componentVNode = jsx(MyComponent, {}) as ComponentVNode;
    const elements = componentVNode.mount();

    expect(elements).toHaveLength(1);
    expect(elements[0]).toBeInstanceOf(HTMLDivElement);
    expect((elements[0] as HTMLDivElement).tagName).toBe("DIV");
  });

  it("should mount a component with text content", () => {
    const MyComponent = () => {
      return () => jsx("div", { children: "Hello World" });
    };

    const componentVNode = jsx(MyComponent, {}) as ComponentVNode;
    const elements = componentVNode.mount();

    expect(elements).toHaveLength(1);
    expect(elements[0].textContent).toBe("Hello World");
  });

  it("should mount a component with nested elements", () => {
    const MyComponent = () => {
      return () =>
        jsx("div", {
          children: [
            jsx("h1", { children: "Title" }),
            jsx("p", { children: "Paragraph" }),
          ],
        });
    };

    const componentVNode = jsx(MyComponent, {}) as ComponentVNode;
    const elements = componentVNode.mount();

    expect(elements).toHaveLength(1);
    const div = elements[0] as HTMLDivElement;
    expect(div.children).toHaveLength(2);
    expect(div.children[0].tagName).toBe("H1");
    expect(div.children[0].textContent).toBe("Title");
    expect(div.children[1].tagName).toBe("P");
    expect(div.children[1].textContent).toBe("Paragraph");
  });

  it("should pass props to component", () => {
    const MyComponent = (props: { message: string }) => {
      return () => jsx("div", { children: props.message });
    };

    const componentVNode = jsx(MyComponent, {
      message: "Hello from props",
    }) as ComponentVNode;
    const elements = componentVNode.mount();

    expect(elements[0].textContent).toBe("Hello from props");
  });

  it("should store parent reference after mount", () => {
    const MyComponent = () => {
      return () => jsx("div", {});
    };

    const parentVNode = jsx("section", {});
    const componentVNode = jsx(MyComponent, {}) as ComponentVNode;

    componentVNode.mount(parentVNode);

    expect(componentVNode.parent).toBe(parentVNode);
  });
});
