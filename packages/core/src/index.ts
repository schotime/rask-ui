export { render } from "./render";
export { createCleanup, createMountEffect, RaskComponent } from "./component";
export { createContext } from "./createContext";
export { createState } from "./createState";
export { createTask } from "./createTask";
export { ErrorBoundary } from "./error";
export { createRef } from "inferno";
export { createView } from "./createView";
export { createEffect } from "./createEffect";
export { createComputed } from "./createComputed";
export { syncBatch } from "./batch";

// Re-export Inferno JSX runtime functions so users don't need to install Inferno directly
export {
  createVNode,
  createComponentVNode,
  createFragment,
  createTextVNode,
  normalizeProps,
} from "inferno";
