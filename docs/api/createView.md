# createView()

Creates a view that merges multiple objects (reactive or plain) into a single object while maintaining reactivity through getters.

```tsx
createView<T>(...objects: object[]): T
```

## Parameters

- `...objects: object[]` - Objects to merge (reactive or plain). Later arguments override earlier ones.

## Returns

A view object with getters for all properties, maintaining reactivity

## Example

```tsx
import { createView, createState } from "rask-ui";

function createCounter() {
  const state = createState({ count: 0, name: "Counter" });
  const increment = () => state.count++;
  const decrement = () => state.count--;
  const reset = () => (state.count = 0);

  return createView(state, { increment, decrement, reset });
}

function Counter() {
  const counter = createCounter();

  return () => (
    <div>
      <h1>
        {counter.name}: {counter.count}
      </h1>
      <button onClick={counter.increment}>+</button>
      <button onClick={counter.decrement}>-</button>
      <button onClick={counter.reset}>Reset</button>
    </div>
  );
}
```

## Features

- Maintains reactivity through getters
- Changes to source objects reflected in view
- Supports enumerable properties and symbols
- Merges multiple sources

## Notes

::: warning
Do not destructure view objects - breaks reactivity
:::
