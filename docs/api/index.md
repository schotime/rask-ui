# API Reference

Complete reference for all RASK APIs.

## Quick Links

- [Core Functions](/api/core) - `render`, `createState`, `createView`, `createRef`
- [Reactivity](/api/reactivity) - `createEffect`, `createComputed`
- [Lifecycle](/api/lifecycle) - `createMountEffect`, `createCleanup`
- [Context](/api/context) - `createContext`
- [Async Data](/api/async) - `createAsync`, `createQuery`, `createMutation`
- [Developer Tools](/api/devtools) - `inspect`
- [Error Handling](/api/error-handling) - `ErrorBoundary`

## Core Concepts

### Component Structure

```tsx
function MyComponent(props) {
  // SETUP PHASE - Runs once
  const state = createState({ value: 0 });

  // RENDER PHASE - Runs on updates
  return () => <div>{state.value}</div>;
}
```

### Reactivity

RASK uses proxy-based reactivity:
- Property access during render is tracked
- Changes trigger re-renders automatically
- Only accessing components re-render
- Deep reactivity for nested objects

### The One Rule

**Never destructure reactive objects:**
- State objects
- Props
- Context values
- Async/Query/Mutation objects
- View objects
- Computed objects

Destructuring breaks reactivity by extracting plain values.

## Import Paths

All exports are available from the main package:

```tsx
import {
  // Core
  render,
  createState,
  createView,
  createRef,

  // Reactivity
  createEffect,
  createComputed,

  // Lifecycle
  createMountEffect,
  createCleanup,

  // Context
  createContext,

  // Async
  createAsync,
  createQuery,
  createMutation,

  // Developer Tools
  inspect,

  // Components
  ErrorBoundary,

  // Types
  Component,
  ChildNode,
} from "rask-ui";
```

## Type Exports

```tsx
import type {
  Component,
  ChildNode,
  Ref,
  Context,
  AsyncState,
  Query,
  Mutation,
} from "rask-ui";
```
