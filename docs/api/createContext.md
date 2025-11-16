# createContext()

Creates a context object for passing data through the component tree without prop drilling.

```tsx
createContext<T>(defaultValue?: T): Context<T>
```

## Parameters

- `defaultValue?: T` - Optional default value if context is not found in parent chain

## Returns

Context object with `inject` and `get` methods

## Example

```tsx
import { createContext } from "rask-ui";

const ThemeContext = createContext<{ color: string }>();

function App() {
  ThemeContext.inject({ color: "blue" });

  return () => <Child />;
}

function Child() {
  const theme = ThemeContext.get();

  return () => <div style={{ color: theme.color }}>Themed text</div>;
}
```

## Context Methods

### inject()

Injects context value for child components.

```tsx
context.inject(value: T): void
```

**Parameters:**
- `value: T` - The value to provide to child components

**Example:**

```tsx
function App() {
  const ThemeContext = createContext<Theme>();

  ThemeContext.inject({
    color: "blue",
    fontSize: 16,
  });

  return () => <Content />;
}
```

**Notes:**
- Must be called during component setup phase
- Value is available to all child components in the tree
- Child contexts can override parent contexts

### get()

Gets context value from nearest parent.

```tsx
context.get(): T
```

**Returns:**
The context value from the nearest parent that called `inject()`

**Example:**

```tsx
function Child() {
  const theme = ThemeContext.get();

  return () => (
    <div style={{ color: theme.color }}>
      Themed content
    </div>
  );
}
```

**Notes:**
- Must be called during component setup phase
- Throws error if context not found in parent chain
- Returns the value from the nearest parent context

## Complete Example

```tsx
import { createContext, createState, createView } from "rask-ui";

interface AuthContext {
  user: { name: string; email: string } | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContext>();

function AuthProvider(props) {
  const state = createState({
    user: null,
    isAuthenticated: false,
  });

  const login = async (email: string, password: string) => {
    const user = await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }).then((r) => r.json());

    state.user = user;
    state.isAuthenticated = true;
  };

  const logout = () => {
    state.user = null;
    state.isAuthenticated = false;
  };

  const auth = createView(state, { login, logout });

  AuthContext.inject(auth);

  return () => props.children;
}

function LoginButton() {
  const auth = AuthContext.get();

  return () => (
    <div>
      {auth.isAuthenticated ? (
        <div>
          <span>Welcome, {auth.user.name}!</span>
          <button onClick={auth.logout}>Logout</button>
        </div>
      ) : (
        <button onClick={() => auth.login("user@example.com", "password")}>
          Login
        </button>
      )}
    </div>
  );
}

function App() {
  return () => (
    <AuthProvider>
      <LoginButton />
    </AuthProvider>
  );
}
```

## Notes

::: warning Important
- Context traversal happens via component tree (parent-child relationships)
- Must be called during component setup phase
- Throws error if context not found
- **Do not destructure** context values - breaks reactivity
:::

::: tip Best Practice
Use context for:
- Theme configuration
- Authentication state
- Localization
- Global app state
- Feature flags

Avoid context for:
- Frequently changing data (use props instead)
- Data that only a few components need (use props instead)
:::
