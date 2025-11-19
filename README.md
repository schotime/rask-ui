# RASK

<p align="center">
  <img src="https://raw.githubusercontent.com/christianalfoni/rask-ui/main/logo.png" alt="Logo" width="200">
</p>

A lightweight reactive component library that combines the simplicity of observable state management with the full power of a virtual DOM reconciler.

**[Visit rask-ui.io for full documentation](https://rask-ui.io)**

## Installation

```bash
npm install rask-ui
```

Or create a new project:

```bash
npm create rask-ui my-app
cd my-app
npm run dev
```

## Quick Example

```tsx
import { createState, render } from "rask-ui";

function Counter() {
  const state = createState({ count: 0 });

  return () => (
    <div>
      <h1>Count: {state.count}</h1>
      <button onClick={() => state.count++}>Increment</button>
    </div>
  );
}

render(<Counter />, document.getElementById("app"));
```

## Reactive Primitives

RASK provides a set of reactive primitives for building interactive UIs:

- **`createState`** - Create reactive state objects
- **`createEffect`** - Run side effects when dependencies change
- **`createComputed`** - Derive values from state with automatic caching
- **`createTask`** - Manage async operations (fetch, mutations, etc.)
- **`createRouter`** - Type-safe client-side routing
- **`createContext`** - Share data through the component tree
- **`createView`** - Compose state and methods into reusable objects

Visit [rask-ui.io](https://rask-ui.io) for complete API documentation and guides.

## License

MIT
