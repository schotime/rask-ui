# createState()

Creates a reactive state object. Any property access during render is tracked, and changes trigger re-renders.

```tsx
createState<T>(initialState: T): T
```

## Parameters

- `initialState: T` - Initial state object

## Returns

Reactive proxy of the state object

## Example

```tsx
import { createState } from "rask-ui";

function Example() {
  const state = createState({
    count: 0,
    items: ["a", "b", "c"],
    nested: { value: 42 },
  });

  // All mutations are reactive
  state.count++;
  state.items.push("d");
  state.nested.value = 100;

  return () => <div>{state.count}</div>;
}
```

## Features

- **Deep reactivity** - Nested objects and arrays are automatically reactive
- **Direct mutations** - No setter functions required
- **Efficient tracking** - Only re-renders components that access changed properties
- **Automatic batching** - Multiple updates batched into single render

## Notes

::: warning
Never destructure state objects - it breaks reactivity:

```tsx
// ❌ Bad
const { count } = state;

// ✅ Good
state.count
```
:::
