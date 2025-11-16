# createEffect()

Creates an effect that automatically tracks reactive dependencies and re-runs whenever they change. The effect runs immediately on creation.

```tsx
createEffect(callback: () => void): void
```

## Parameters

- `callback: () => void` - Function to run when dependencies change

## Example

```tsx
import { createEffect, createState } from "rask-ui";

function Timer() {
  const state = createState({ count: 0, log: [] });

  // Effect runs immediately and whenever state.count changes
  createEffect(() => {
    console.log("Count changed:", state.count);
    state.log.push(`Count: ${state.count}`);
  });

  return () => (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => state.count++}>Increment</button>
      <ul>
        {state.log.map((entry, i) => (
          <li key={i}>{entry}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Features

- **Immediate execution** - Runs immediately on creation
- **Automatic tracking** - Tracks reactive dependencies accessed during execution
- **Microtask batching** - Re-runs on microtask when dependencies change
- **Automatic cleanup** - Cleaned up when component unmounts

## Use Cases

- Logging state changes
- Syncing to localStorage
- Updating derived state
- Side effects based on state

## Notes

::: warning Important
- Only call during component setup phase (not in render function)
- Effects are queued on microtask to avoid synchronous execution
- Be careful with effects that modify state - can cause infinite loops
:::
