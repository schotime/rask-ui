import { describe, it, expect } from "vitest";
import { jsx, render } from "../vdom";
import { createState } from "../createState";

describe("Component Props", () => {
  it("should pass string props to component", () => {
    const container = document.createElement("div");
    const MyComponent = (props: { message: string }) => {
      return () => jsx("div", { children: props.message });
    };

    render(jsx(MyComponent, { message: "Hello Props" }), container);

    expect(container.children[0].textContent).toBe("Hello Props");
  });

  it("should pass number props to component", () => {
    const container = document.createElement("div");
    const MyComponent = (props: { count: number }) => {
      return () => jsx("div", { children: String(props.count) });
    };

    render(jsx(MyComponent, { count: 42 }), container);

    expect(container.children[0].textContent).toBe("42");
  });

  it("should pass object props to component", () => {
    const container = document.createElement("div");
    const MyComponent = (props: { user: { name: string; age: number } }) => {
      return () =>
        jsx("div", {
          children: `${props.user.name} is ${props.user.age}`,
        });
    };

    render(jsx(MyComponent, { user: { name: "Alice", age: 25 } }), container);

    expect(container.children[0].textContent).toBe("Alice is 25");
  });

  it("should pass array props to component", () => {
    const container = document.createElement("div");
    const MyComponent = (props: { items: string[] }) => {
      return () =>
        jsx("ul", {
          children: props.items.map((item) => jsx("li", { children: item })),
        });
    };

    render(
      jsx(MyComponent, { items: ["apple", "banana", "cherry"] }),
      container
    );

    const ul = container.children[0] as HTMLUListElement;
    expect(ul.children).toHaveLength(3);
    expect(ul.children[0].textContent).toBe("apple");
    expect(ul.children[1].textContent).toBe("banana");
    expect(ul.children[2].textContent).toBe("cherry");
  });

  it("should pass function props to component", () => {
    const container = document.createElement("div");
    const handleClick = () => "clicked";
    const MyComponent = (props: { onClick: () => string }) => {
      return () =>
        jsx("button", {
          children: props.onClick(),
        });
    };

    render(jsx(MyComponent, { onClick: handleClick }), container);

    expect(container.children[0].textContent).toBe("clicked");
  });

  it("should pass multiple props to component", () => {
    const container = document.createElement("div");
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

    render(
      jsx(MyComponent, { title: "Counter", count: 5, isActive: true }),
      container
    );

    expect(container.children[0].textContent).toBe("Counter: 5 (active)");
  });

  it("should handle optional props", () => {
    const container1 = document.createElement("div");
    const container2 = document.createElement("div");
    const MyComponent = (props: { message?: string }) => {
      return () =>
        jsx("div", {
          children: props.message || "Default message",
        });
    };

    render(jsx(MyComponent, {}), container1);
    expect(container1.children[0].textContent).toBe("Default message");

    render(jsx(MyComponent, { message: "Custom message" }), container2);
    expect(container2.children[0].textContent).toBe("Custom message");
  });

  it("should pass props from parent to child component", () => {
    const container = document.createElement("div");

    const ChildComponent = (props: { message: string }) => {
      return () => jsx("div", { children: props.message });
    };

    const ParentComponent = (props: { text: string }) => {
      return () =>
        jsx("div", {
          children: jsx(ChildComponent, { message: props.text }),
        });
    };

    render(jsx(ParentComponent, { text: "Hello from parent" }), container);
    expect(container.children[0].children[0].textContent).toBe(
      "Hello from parent"
    );
  });

  it("should pass props through multiple levels of nesting", () => {
    const container = document.createElement("div");

    const GrandchildComponent = (props: { value: string }) => {
      return () => jsx("span", { children: props.value });
    };

    const ChildComponent = (props: { data: string }) => {
      return () =>
        jsx("div", {
          children: jsx(GrandchildComponent, { value: props.data }),
        });
    };

    const ParentComponent = (props: { info: string }) => {
      return () =>
        jsx("div", {
          children: jsx(ChildComponent, { data: props.info }),
        });
    };

    render(jsx(ParentComponent, { info: "Deep nested value" }), container);
    const span = container.querySelector("span");
    expect(span?.textContent).toBe("Deep nested value");
  });

  it("should update nested component when parent props change", async () => {
    const container = document.createElement("div");

    const ChildComponent = (props: { count: number }) => {
      return () => jsx("div", { children: String(props.count) });
    };

    const ParentComponent = () => {
      const state = createState({ value: 5 });

      return () =>
        jsx("div", {
          children: [
            jsx(ChildComponent, { count: state.value }),
            jsx("button", {
              onclick: () => (state.value = 10),
              children: "Update",
            }),
          ],
        });
    };

    render(jsx(ParentComponent, {}), container);
    expect(container.children[0].children[0].textContent).toBe("5");

    // Trigger update
    (container.querySelector("button") as HTMLButtonElement).click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(container.children[0].children[0].textContent).toBe("10");
  });

  it("should correctly update props in nested components with state changes", async () => {
    const container = document.createElement("div");

    const ChildComponent = (props: { message: string; count: number }) => {
      return () => jsx("div", { children: `${props.message}: ${props.count}` });
    };

    const ParentComponent = () => {
      const state = createState({ count: 0 });

      return () =>
        jsx("div", {
          children: [
            jsx(ChildComponent, { message: "Count", count: state.count }),
            jsx("button", {
              onclick: () => state.count++,
              children: "Increment",
            }),
          ],
        });
    };

    render(jsx(ParentComponent, {}), container);

    // Check initial state
    const childDiv = container.querySelector(
      ":scope > div > div"
    ) as HTMLElement;

    expect(childDiv.textContent).toBe("Count: 0");

    // Simulate button click
    const button = container.querySelector("button") as HTMLButtonElement;
    button.click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Check updated state - THIS is where the bug would show
    // If old props are used instead of new props, this will fail
    expect(childDiv.textContent).toBe("Count: 1");
  });

  it("should pass updated object props to nested components", async () => {
    const container = document.createElement("div");

    const ChildComponent = (props: { user: { name: string; age: number } }) => {
      return () =>
        jsx("div", { children: `${props.user.name} - ${props.user.age}` });
    };

    const ParentComponent = () => {
      const state = createState({
        userData: { name: "Alice", age: 25 },
      });

      return () =>
        jsx("div", {
          children: [
            jsx(ChildComponent, { user: state.userData }),
            jsx("button", {
              onclick: () => {
                state.userData.name = "Bob";
                state.userData.age = 30;
              },
              children: "Update",
            }),
          ],
        });
    };

    render(jsx(ParentComponent, {}), container);
    expect(container.children[0].children[0].textContent).toBe("Alice - 25");

    // Trigger update
    (container.querySelector("button") as HTMLButtonElement).click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(container.children[0].children[0].textContent).toBe("Bob - 30");
  });

  it("should correctly update props in deeply nested components on state change", async () => {
    const container = document.createElement("div");

    const DeepChild = (props: { value: number }) => {
      return () => jsx("span", { children: String(props.value) });
    };

    const MiddleChild = (props: { data: number }) => {
      return () =>
        jsx("div", {
          children: jsx(DeepChild, { value: props.data }),
        });
    };

    const ParentComponent = () => {
      const state = createState({ value: 100 });

      return () =>
        jsx("div", {
          children: [
            jsx(MiddleChild, { data: state.value }),
            jsx("button", {
              onclick: () => (state.value += 50),
              children: "Update",
            }),
          ],
        });
    };

    render(jsx(ParentComponent, {}), container);

    // Check initial state
    const span = container.querySelector("span") as HTMLElement;
    expect(span.textContent).toBe("100");

    // Trigger update
    const button = container.querySelector("button") as HTMLButtonElement;
    button.click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    // THIS is the critical test - ensures new props propagate correctly
    expect(span.textContent).toBe("150");
  });

  it("should handle multiple nested components receiving different updated props", async () => {
    const container = document.createElement("div");

    const ChildA = (props: { value: string }) => {
      return () => jsx("div", { class: "child-a", children: props.value });
    };

    const ChildB = (props: { value: string }) => {
      return () => jsx("div", { class: "child-b", children: props.value });
    };

    const ParentComponent = () => {
      const state = createState({ valueA: "A1", valueB: "B1" });

      return () =>
        jsx("div", {
          children: [
            jsx(ChildA, { value: state.valueA }),
            jsx(ChildB, { value: state.valueB }),
            jsx("button", {
              class: "btn-a",
              onclick: () => (state.valueA = "A2"),
              children: "Update A",
            }),
            jsx("button", {
              class: "btn-b",
              onclick: () => (state.valueB = "B2"),
              children: "Update B",
            }),
          ],
        });
    };

    render(jsx(ParentComponent, {}), container);

    const childA = container.querySelector(".child-a") as HTMLElement;
    const childB = container.querySelector(".child-b") as HTMLElement;

    expect(childA.textContent).toBe("A1");
    expect(childB.textContent).toBe("B1");

    // Update only A
    (container.querySelector(".btn-a") as HTMLButtonElement).click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(childA.textContent).toBe("A2");
    expect(childB.textContent).toBe("B1"); // B should remain unchanged

    // Update only B
    (container.querySelector(".btn-b") as HTMLButtonElement).click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(childA.textContent).toBe("A2"); // A should remain unchanged
    expect(childB.textContent).toBe("B2");
  });

  it("should pass array of props to nested components and update correctly", async () => {
    const container = document.createElement("div");

    const ItemComponent = (props: { item: string; index: number }) => {
      return () => jsx("li", { children: `${props.index}: ${props.item}` });
    };

    const ListComponent = (props: { items: string[] }) => {
      return () =>
        jsx("ul", {
          children: props.items.map((item, index) =>
            jsx(ItemComponent, { item, index, key: index })
          ),
        });
    };

    const ParentComponent = () => {
      const state = createState({ items: ["apple", "banana"] });

      return () =>
        jsx("div", {
          children: [
            jsx(ListComponent, { items: state.items }),
            jsx("button", {
              onclick: () => state.items.push("cherry"),
              children: "Add",
            }),
          ],
        });
    };

    render(jsx(ParentComponent, {}), container);

    const ul = container.querySelector("ul") as HTMLElement;
    expect(ul.children.length).toBe(2);
    expect(ul.children[0].textContent).toBe("0: apple");
    expect(ul.children[1].textContent).toBe("1: banana");

    // Add item
    (container.querySelector("button") as HTMLButtonElement).click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(ul.children.length).toBe(3);
    expect(ul.children[2].textContent).toBe("2: cherry");
  });

  it("should maintain correct prop values when sibling components update", async () => {
    const container = document.createElement("div");

    const DisplayComponent = (props: { label: string; value: number }) => {
      return () =>
        jsx("div", {
          class: props.label.toLowerCase().replace(/\s/g, "-"),
          children: `${props.label}: ${props.value}`,
        });
    };

    const ParentComponent = () => {
      const state = createState({ countA: 0, countB: 100 });

      return () =>
        jsx("div", {
          children: [
            jsx(DisplayComponent, { label: "Counter A", value: state.countA }),
            jsx(DisplayComponent, { label: "Counter B", value: state.countB }),
            jsx("button", {
              class: "update-a",
              onclick: () => state.countA++,
              children: "Inc A",
            }),
          ],
        });
    };

    render(jsx(ParentComponent, {}), container);

    const displayA = container.querySelector(".counter-a") as HTMLElement;
    const displayB = container.querySelector(".counter-b") as HTMLElement;

    // Update A
    (container.querySelector(".update-a") as HTMLButtonElement).click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Ensure A updated and B kept its value (didn't get stale/wrong props)
    expect(displayA?.textContent).toContain("1");
    expect(displayB?.textContent).toContain("100");
  });
});
