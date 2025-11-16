# createRef()

Creates a ref object for accessing DOM elements or component instances directly.

```tsx
createRef<T>(): Ref<T>
```

## Returns

Ref object with:
- `current: T | null` - Reference to the DOM element or component instance
- Function signature for use as ref callback

## Example

```tsx
import { createRef } from "rask-ui";

function Example() {
  const inputRef = createRef<HTMLInputElement>();

  const focus = () => {
    inputRef.current?.focus();
  };

  return () => (
    <div>
      <input ref={inputRef} type="text" />
      <button onClick={focus}>Focus Input</button>
    </div>
  );
}
```

## Usage

Pass the ref to an element's `ref` prop. The `current` property will be set to the DOM element when mounted and `null` when unmounted.

## TypeScript

```tsx
// Generic type parameter for specific element types
const inputRef = createRef<HTMLInputElement>();
const divRef = createRef<HTMLDivElement>();
const buttonRef = createRef<HTMLButtonElement>();
```
