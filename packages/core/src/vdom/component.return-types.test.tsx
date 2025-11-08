import { describe, it, expect } from "vitest";
import { ComponentVNode } from "./ComponentVNode";
import { jsx } from "./index";
import { createState } from "../createState";

describe("Component Return Types", () => {
  describe("Static Return Values", () => {
    it("should handle component returning a single element", () => {
      const MyComponent = () => {
        return () => jsx("div", { children: "Hello" });
      };

      const componentVNode = jsx(MyComponent, {}) as ComponentVNode;
      const elements = componentVNode.mount();

      expect(elements).toHaveLength(1);
      expect(elements[0]).toBeInstanceOf(HTMLDivElement);
      expect(elements[0].textContent).toBe("Hello");
    });

    it("should handle component returning a text string", () => {
      const MyComponent = () => {
        return () => "Hello World";
      };

      const componentVNode = jsx(MyComponent, {}) as ComponentVNode;
      const elements = componentVNode.mount();

      expect(elements).toHaveLength(1);
      expect(elements[0]).toBeInstanceOf(Text);
      expect(elements[0].textContent).toBe("Hello World");
    });

    it("should handle component returning a number", () => {
      const MyComponent = () => {
        return () => 42;
      };

      const componentVNode = jsx(MyComponent, {}) as ComponentVNode;
      const elements = componentVNode.mount();

      expect(elements).toHaveLength(1);
      expect(elements[0].textContent).toBe("42");
    });

    it("should handle component returning null", () => {
      const MyComponent = () => {
        return () => null;
      };

      const componentVNode = jsx(MyComponent, {}) as ComponentVNode;
      const elements = componentVNode.mount();

      // Null should render as empty fragment or empty array
      expect(elements).toBeDefined();
    });

    it("should handle component returning undefined", () => {
      const MyComponent = () => {
        return () => undefined;
      };

      const componentVNode = jsx(MyComponent, {}) as ComponentVNode;
      const elements = componentVNode.mount();

      // Undefined should render as empty fragment or empty array
      expect(elements).toBeDefined();
    });

    it("should handle component returning a fragment with multiple children", () => {
      const MyComponent = () => {
        return () =>
          jsx("Fragment", {
            children: [
              jsx("div", { children: "First" }),
              jsx("div", { children: "Second" }),
              jsx("div", { children: "Third" }),
            ],
          });
      };

      const componentVNode = jsx(MyComponent, {}) as ComponentVNode;
      const elements = componentVNode.mount();

      expect(elements.length).toBeGreaterThanOrEqual(3);
    });

    it("should handle component returning an array of elements", () => {
      const MyComponent = () => {
        return () => [
          jsx("span", { children: "A" }),
          jsx("span", { children: "B" }),
          jsx("span", { children: "C" }),
        ];
      };

      const componentVNode = jsx(MyComponent, {}) as ComponentVNode;
      const elements = componentVNode.mount();

      expect(elements.length).toBeGreaterThanOrEqual(3);
    });

    it("should handle component returning nested components", () => {
      const InnerComponent = () => {
        return () => jsx("span", { children: "Inner" });
      };

      const OuterComponent = () => {
        return () => jsx(InnerComponent, {});
      };

      const componentVNode = jsx(OuterComponent, {}) as ComponentVNode;
      const elements = componentVNode.mount();

      expect(elements).toHaveLength(1);
      expect(elements[0].textContent).toBe("Inner");
    });

    it("should handle component returning boolean false", () => {
      const MyComponent = () => {
        return () => false;
      };

      const componentVNode = jsx(MyComponent, {}) as ComponentVNode;
      const elements = componentVNode.mount();

      // False should render as empty or be filtered out
      expect(elements).toBeDefined();
    });

    it("should handle component returning boolean true", () => {
      const MyComponent = () => {
        return () => true;
      };

      const componentVNode = jsx(MyComponent, {}) as ComponentVNode;
      const elements = componentVNode.mount();

      // True should render as empty or be filtered out
      expect(elements).toBeDefined();
    });
  });

  describe("Dynamic Return Values", () => {
    it("should handle component switching from element to string", async () => {
      let stateFn: { showElement: boolean } | undefined;

      const MyComponent = () => {
        const state = createState({ showElement: true });
        stateFn = state;

        return () =>
          state.showElement
            ? jsx("div", { children: "Element" })
            : "Just text";
      };

      const componentVNode = jsx(MyComponent, {}) as ComponentVNode;
      const elements = componentVNode.mount();

      expect(elements[0]).toBeInstanceOf(HTMLDivElement);

      stateFn!.showElement = false;
      await new Promise((resolve) => setTimeout(resolve, 0));

      const updatedElements = componentVNode.getElements();
      expect(updatedElements[0]).toBeInstanceOf(Text);
      expect(updatedElements[0].textContent).toBe("Just text");
    });

    it("should handle component switching from null to element", async () => {
      let stateFn: { show: boolean } | undefined;

      const MyComponent = () => {
        const state = createState({ show: false });
        stateFn = state;

        return () =>
          state.show ? jsx("div", { children: "Visible" }) : null;
      };

      const componentVNode = jsx(MyComponent, {}) as ComponentVNode;
      componentVNode.mount();

      stateFn!.show = true;
      await new Promise((resolve) => setTimeout(resolve, 0));

      const elements = componentVNode.getElements();
      expect(elements.length).toBeGreaterThan(0);
      expect(elements[0].textContent).toBe("Visible");
    });

    it("should handle component switching from element to null", async () => {
      let stateFn: { show: boolean } | undefined;

      const MyComponent = () => {
        const state = createState({ show: true });
        stateFn = state;

        return () =>
          state.show ? jsx("div", { children: "Visible" }) : null;
      };

      const componentVNode = jsx(MyComponent, {}) as ComponentVNode;
      componentVNode.mount();

      stateFn!.show = false;
      await new Promise((resolve) => setTimeout(resolve, 0));

      const elements = componentVNode.getElements();
      expect(elements).toBeDefined();
    });

    it("should handle component switching between different element types", async () => {
      let stateFn: { type: "div" | "span" | "p" } | undefined;

      const MyComponent = () => {
        const state = createState<{ type: "div" | "span" | "p" }>({
          type: "div",
        });
        stateFn = state;

        return () => jsx(state.type, { children: "Content" });
      };

      const componentVNode = jsx(MyComponent, {}) as ComponentVNode;
      const elements = componentVNode.mount();

      expect(elements[0]).toBeInstanceOf(HTMLDivElement);

      stateFn!.type = "span";
      await new Promise((resolve) => setTimeout(resolve, 0));

      const spanElements = componentVNode.getElements();
      expect(spanElements[0]).toBeInstanceOf(HTMLSpanElement);

      stateFn!.type = "p";
      await new Promise((resolve) => setTimeout(resolve, 0));

      const pElements = componentVNode.getElements();
      expect(pElements[0]).toBeInstanceOf(HTMLParagraphElement);
    });

    it("should handle component switching from single element to array", async () => {
      let stateFn: { multiple: boolean } | undefined;

      const MyComponent = () => {
        const state = createState({ multiple: false });
        stateFn = state;

        return () =>
          state.multiple
            ? [
                jsx("div", { children: "First" }),
                jsx("div", { children: "Second" }),
              ]
            : jsx("div", { children: "Single" });
      };

      const componentVNode = jsx(MyComponent, {}) as ComponentVNode;
      componentVNode.mount();

      stateFn!.multiple = true;
      await new Promise((resolve) => setTimeout(resolve, 0));

      const elements = componentVNode.getElements();
      expect(elements.length).toBeGreaterThanOrEqual(2);
    });

    it("should handle component switching from array to single element", async () => {
      let stateFn: { multiple: boolean } | undefined;

      const MyComponent = () => {
        const state = createState({ multiple: true });
        stateFn = state;

        return () =>
          state.multiple
            ? [
                jsx("div", { children: "First" }),
                jsx("div", { children: "Second" }),
              ]
            : jsx("div", { children: "Single" });
      };

      const componentVNode = jsx(MyComponent, {}) as ComponentVNode;
      componentVNode.mount();

      stateFn!.multiple = false;
      await new Promise((resolve) => setTimeout(resolve, 0));

      const elements = componentVNode.getElements();
      expect(elements).toHaveLength(1);
      expect(elements[0].textContent).toBe("Single");
    });

    it("should handle component dynamically changing array length", async () => {
      let stateFn: { count: number } | undefined;

      const MyComponent = () => {
        const state = createState({ count: 2 });
        stateFn = state;

        return () =>
          Array.from({ length: state.count }, (_, i) =>
            jsx("div", { children: `Item ${i}` })
          );
      };

      const componentVNode = jsx(MyComponent, {}) as ComponentVNode;
      componentVNode.mount();

      stateFn!.count = 5;
      await new Promise((resolve) => setTimeout(resolve, 0));

      const elements = componentVNode.getElements();
      expect(elements.length).toBeGreaterThanOrEqual(5);

      stateFn!.count = 1;
      await new Promise((resolve) => setTimeout(resolve, 0));

      const reducedElements = componentVNode.getElements();
      expect(reducedElements).toHaveLength(1);
    });

    it("should handle component switching between string and number", async () => {
      let stateFn: { value: string | number } | undefined;

      const MyComponent = () => {
        const state = createState<{ value: string | number }>({
          value: "Hello",
        });
        stateFn = state;

        return () => state.value;
      };

      const componentVNode = jsx(MyComponent, {}) as ComponentVNode;
      const elements = componentVNode.mount();

      expect(elements[0].textContent).toBe("Hello");

      stateFn!.value = 42;
      await new Promise((resolve) => setTimeout(resolve, 0));

      const updatedElements = componentVNode.getElements();
      expect(updatedElements[0].textContent).toBe("42");
    });

    it("should handle component conditionally returning component or element", async () => {
      let stateFn: { useComponent: boolean } | undefined;

      const InnerComponent = () => {
        return () => jsx("span", { children: "Component" });
      };

      const MyComponent = () => {
        const state = createState({ useComponent: true });
        stateFn = state;

        return () =>
          state.useComponent
            ? jsx(InnerComponent, {})
            : jsx("div", { children: "Element" });
      };

      const componentVNode = jsx(MyComponent, {}) as ComponentVNode;
      componentVNode.mount();

      stateFn!.useComponent = false;
      await new Promise((resolve) => setTimeout(resolve, 0));

      const elements = componentVNode.getElements();
      expect(elements[0]).toBeInstanceOf(HTMLDivElement);
      expect(elements[0].textContent).toBe("Element");
    });

    it("should handle rapid switching between return types", async () => {
      let stateFn: { type: "element" | "string" | "null" } | undefined;

      const MyComponent = () => {
        const state = createState<{ type: "element" | "string" | "null" }>({
          type: "element",
        });
        stateFn = state;

        return () => {
          if (state.type === "element") {
            return jsx("div", { children: "Element" });
          }
          if (state.type === "string") {
            return "String";
          }
          return null;
        };
      };

      const componentVNode = jsx(MyComponent, {}) as ComponentVNode;
      componentVNode.mount();

      stateFn!.type = "string";
      await new Promise((resolve) => setTimeout(resolve, 0));

      stateFn!.type = "null";
      await new Promise((resolve) => setTimeout(resolve, 0));

      stateFn!.type = "element";
      await new Promise((resolve) => setTimeout(resolve, 0));

      const elements = componentVNode.getElements();
      expect(elements).toBeDefined();
    });
  });

  describe("Edge Cases", () => {
    it("should handle component returning empty array", () => {
      const MyComponent = () => {
        return () => [];
      };

      const componentVNode = jsx(MyComponent, {}) as ComponentVNode;
      const elements = componentVNode.mount();

      expect(elements).toBeDefined();
      expect(Array.isArray(elements)).toBe(true);
    });

    it("should handle component returning array with nulls", () => {
      const MyComponent = () => {
        return () => [
          jsx("div", { children: "First" }),
          null,
          jsx("div", { children: "Third" }),
        ];
      };

      const componentVNode = jsx(MyComponent, {}) as ComponentVNode;
      const elements = componentVNode.mount();

      expect(elements).toBeDefined();
    });

    it("should handle component returning mixed array types", () => {
      const MyComponent = () => {
        return () => [
          jsx("div", { children: "Element" }),
          "String",
          42,
          jsx("span", { children: "Another" }),
        ];
      };

      const componentVNode = jsx(MyComponent, {}) as ComponentVNode;
      const elements = componentVNode.mount();

      expect(elements.length).toBeGreaterThan(0);
    });

    it("should handle deeply nested return values", () => {
      const Level3 = () => () => jsx("span", { children: "Deep" });
      const Level2 = () => () => jsx(Level3, {});
      const Level1 = () => () => jsx(Level2, {});

      const componentVNode = jsx(Level1, {}) as ComponentVNode;
      const elements = componentVNode.mount();

      expect(elements[0].textContent).toBe("Deep");
    });

    it("should handle component switching from empty array to elements", async () => {
      let stateFn: { items: string[] } | undefined;

      const MyComponent = () => {
        const state = createState({ items: [] as string[] });
        stateFn = state;

        return () =>
          state.items.map((item) => jsx("div", { children: item }));
      };

      const componentVNode = jsx(MyComponent, {}) as ComponentVNode;
      componentVNode.mount();

      stateFn!.items = ["A", "B", "C"];
      await new Promise((resolve) => setTimeout(resolve, 0));

      const elements = componentVNode.getElements();
      expect(elements.length).toBeGreaterThanOrEqual(3);
    });
  });
});
