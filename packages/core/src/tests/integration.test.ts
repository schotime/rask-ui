import { describe, it, expect, vi } from "vitest";
import { onCleanup, onMount } from "../vdom/ComponentVNode";
import { jsx, render } from "../vdom";
import { createState } from "../createState";
import { createRef } from "../createRef";
import { createContext } from "../createContext";
import { ErrorBoundary } from "../error";

describe("Integration Tests", () => {
  it("should render a simple component", () => {
    function App() {
      return () => jsx("div", { children: "Hello World" });
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(jsx(App, {}), container);

    // After patch, container is replaced, so check body instead
    expect(document.body.textContent).toContain("Hello World");
  });

  it("should handle reactive state updates", async () => {
    function Counter() {
      const state = createState({ count: 0 });

      return () =>
        jsx("div", {
          children: [
            jsx("span", { children: `Count: ${state.count}` }),
            jsx("button", {
              onClick: () => state.count++,
              children: "Increment",
            }),
          ],
        });
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(jsx(Counter, {}), container);

    expect(document.body.textContent).toContain("Count: 0");

    // Simulate click
    const button = document.querySelector("button");
    button?.click();

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(document.body.textContent).toContain("Count: 1");
  });

  it("should work with refs", async () => {
    function App() {
      const ref = createRef<HTMLDivElement>();

      onMount(() => {
        expect(ref.current).not.toBeNull();
        expect(ref.current?.tagName).toBe("DIV");
      });

      return () => jsx("div", { ref, children: "Test" });
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(jsx(App, {}), container);

    await new Promise((resolve) => setTimeout(resolve, 10));
  });

  it("should handle context", () => {
    const ThemeContext = createContext<{ theme: string }>();

    function Child() {
      const theme = ThemeContext.get();
      return () => jsx("div", { class: "child", children: theme.theme });
    }

    function Parent() {
      ThemeContext.inject({ theme: "dark" });
      return () => jsx(Child, {});
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(jsx(Parent, {}), container);

    expect(document.body.textContent).toContain("dark");
  });

  it("should handle error boundaries", async () => {
    function ThrowingChild() {
      return () => {
        throw new Error("Test error");
      };
    }

    function App() {
      return () =>
        jsx(ErrorBoundary, {
          error: (error: any) =>
            jsx("div", {
              class: "error",
              children: `Error: ${String(error)}`,
            }),
          children: jsx(ThrowingChild, {}),
        });
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(jsx(App, {}), container);

    await new Promise((resolve) => setTimeout(resolve, 10));

    const errorDiv = document.querySelector(".error");
    expect(errorDiv).not.toBeNull();
    expect(errorDiv?.textContent).toContain("Test error");
  });

  it("should call onMount and onCleanup", async () => {
    const mountFn = vi.fn();
    const cleanupFn = vi.fn();
    let stateFn: { show: boolean } | undefined;

    function Component() {
      onMount(mountFn);
      onCleanup(cleanupFn);
      return () => jsx("div", { children: "Test" });
    }

    function App() {
      const state = createState({ show: true });
      stateFn = state;
      return () =>
        state.show ? jsx(Component, {}) : jsx("div", { children: "Empty" });
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(jsx(App, {}), container);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(mountFn).toHaveBeenCalledTimes(1);
    expect(cleanupFn).not.toHaveBeenCalled();

    // Unmount by toggling state to render something else
    stateFn!.show = false;

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(cleanupFn).toHaveBeenCalledTimes(1);
  });

  it("should handle nested components", () => {
    function GrandChild() {
      return () => jsx("span", { children: "GrandChild" });
    }

    function Child() {
      return () =>
        jsx("div", {
          children: ["Child ", jsx(GrandChild, {})],
        });
    }

    function Parent() {
      return () =>
        jsx("div", {
          children: ["Parent ", jsx(Child, {})],
        });
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(jsx(Parent, {}), container);

    expect(document.body.textContent).toContain("Parent");
    expect(document.body.textContent).toContain("Child");
    expect(document.body.textContent).toContain("GrandChild");
  });

  it("should handle conditional rendering", async () => {
    function App() {
      const state = createState({ show: true });

      return () =>
        jsx("div", {
          children: [
            jsx("button", {
              onClick: () => (state.show = !state.show),
              children: "Toggle",
            }),
            state.show
              ? jsx("div", { class: "content", children: "Content" })
              : null,
          ],
        });
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(jsx(App, {}), container);

    // Wait for initial render
    await new Promise((resolve) => setTimeout(resolve, 5));

    expect(document.querySelector(".content")).not.toBeNull();

    const button = document.querySelector("button");
    button?.click();

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(document.querySelector(".content")).toBeNull();
  });

  it("should handle list rendering", async () => {
    function TodoList() {
      const state = createState({ items: ["Item 1", "Item 2"] });

      return () =>
        jsx("div", {
          children: [
            jsx("button", {
              onClick: () => {
                state.items.push(`Item ${state.items.length + 1}`);
              },
              children: "Add",
            }),
            jsx("ul", {
              children: state.items.map((item) =>
                jsx("li", { children: item })
              ),
            }),
          ],
        });
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(jsx(TodoList, {}), container);

    expect(document.querySelectorAll("li").length).toBe(2);

    const button = document.querySelector("button");
    button?.click();

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(document.querySelectorAll("li").length).toBe(3);
  });
});
