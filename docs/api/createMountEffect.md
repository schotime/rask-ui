# createMountEffect()

Registers a callback to run after the component is mounted to the DOM.

```tsx
createMountEffect(callback: () => void | (() => void)): void
```

## Parameters

- `callback: () => void | (() => void)` - Function to call on mount. Can optionally return a cleanup function.

## Example

```tsx
import { createMountEffect } from "rask-ui";

function Example() {
  createMountEffect(() => {
    console.log("Component mounted!");
  });

  return () => <div>Hello</div>;
}
```

## With Cleanup

```tsx
function Timer() {
  const state = createState({ time: Date.now() });

  createMountEffect(() => {
    const interval = setInterval(() => {
      state.time = Date.now();
    }, 1000);

    // Return cleanup function
    return () => {
      clearInterval(interval);
    };
  });

  return () => <div>{state.time}</div>;
}
```

## Features

- Runs after component is mounted to DOM
- Can return cleanup function
- Multiple mount effects can be registered
- Cleanup runs when component unmounts

## Use Cases

- Initializing subscriptions
- Starting timers
- Adding event listeners
- Fetching initial data
- Setting up third-party libraries

## Notes

::: warning Important
- Only call during component setup phase (not in render function)
- Can be called multiple times to register multiple callbacks
- Cleanup function is optional
:::
