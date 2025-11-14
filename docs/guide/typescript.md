# TypeScript Support

RASK is written in TypeScript and provides full type inference.

## Basic Usage

Types are automatically inferred:

```tsx
import { createState, Component } from "rask-ui";

function Counter() {
  // Type is automatically inferred as { count: number }
  const state = createState({ count: 0 });

  // TypeScript knows state.count is a number
  return () => (
    <div>
      <h1>Count: {state.count}</h1>
      <button onClick={() => state.count++}>Increment</button>
    </div>
  );
}
```

## Typing Components

Use the `Component` type for typed component props:

```tsx
import { Component } from "rask-ui";

interface TodoItemProps {
  todo: {
    id: number;
    text: string;
    done: boolean;
  };
  onToggle: (id: number) => void;
}

const TodoItem: Component<TodoItemProps> = (props) => {
  return () => (
    <li onClick={() => props.onToggle(props.todo.id)}>
      {props.todo.text}
    </li>
  );
};
```

## Explicit State Types

Provide explicit types when needed:

```tsx
interface Todo {
  id: number;
  text: string;
  done: boolean;
}

interface AppState {
  todos: Todo[];
  filter: string;
}

function TodoList() {
  const state = createState<AppState>({
    todos: [],
    filter: "all",
  });

  // TypeScript ensures type safety
  const addTodo = (text: string) => {
    state.todos.push({
      id: Date.now(),
      text,
      done: false,
    });
  };

  return () => (
    <ul>
      {state.todos.map((todo) => (
        <li key={todo.id}>{todo.text}</li>
      ))}
    </ul>
  );
}
```

## Typing Context

Create typed contexts:

```tsx
interface Theme {
  color: string;
  fontSize: number;
}

const ThemeContext = createContext<Theme>();

function App() {
  ThemeContext.inject({ color: "blue", fontSize: 16 });

  return () => <Child />;
}

function Child() {
  const theme = ThemeContext.get(); // Type is Theme

  return () => (
    <div style={{ color: theme.color, fontSize: theme.fontSize }}>
      Themed text
    </div>
  );
}
```

## Typing Computed Values

Computed values are automatically typed:

```tsx
interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

function ShoppingCart() {
  const state = createState({
    items: [] as CartItem[],
    taxRate: 0.2,
  });

  const computed = createComputed({
    // Return type is automatically number
    subtotal: () =>
      state.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    tax: () => computed.subtotal * state.taxRate,
    total: () => computed.subtotal + computed.tax,
  });

  return () => (
    <div>
      <p>Total: ${computed.total.toFixed(2)}</p>
    </div>
  );
}
```

## Typing Async Data

Type async operations:

```tsx
interface User {
  id: number;
  name: string;
  email: string;
}

function UserProfile() {
  const user = createAsync<User>(
    fetch("/api/user").then((r) => r.json())
  );

  return () => {
    if (user.isPending) {
      return <p>Loading...</p>;
    }

    if (user.error) {
      return <p>Error: {user.error}</p>;
    }

    // TypeScript knows user.value is User | null
    return <p>Hello, {user.value?.name}!</p>;
  };
}
```

## Typing Queries

Type query results:

```tsx
interface Post {
  id: number;
  title: string;
  body: string;
}

function Posts() {
  const posts = createQuery<Post[]>(() =>
    fetch("/api/posts").then((r) => r.json())
  );

  return () => {
    if (posts.isPending) {
      return <p>Loading...</p>;
    }

    if (posts.error) {
      return <p>Error: {posts.error}</p>;
    }

    // TypeScript knows posts.data is Post[] | null
    return (
      <div>
        {posts.data?.map((post) => (
          <article key={post.id}>{post.title}</article>
        ))}
      </div>
    );
  };
}
```

## Typing Mutations

Type mutation parameters:

```tsx
interface CreatePostData {
  title: string;
  body: string;
}

function CreatePost() {
  const state = createState({ title: "", body: "" });

  const create = createMutation<CreatePostData>((data) =>
    fetch("/api/posts", {
      method: "POST",
      body: JSON.stringify(data),
    })
  );

  const handleSubmit = () => {
    create.mutate({ title: state.title, body: state.body });
  };

  return () => (
    <form onSubmit={handleSubmit}>
      <input
        value={state.title}
        onInput={(e) => (state.title = e.target.value)}
      />
      <button disabled={create.isPending}>Create</button>
    </form>
  );
}
```

## JSX Element Types

Use proper JSX element types:

```tsx
import { ChildNode } from "rask-ui";

interface LayoutProps {
  header: ChildNode;
  children: ChildNode;
}

const Layout: Component<LayoutProps> = (props) => {
  return () => (
    <div>
      <header>{props.header}</header>
      <main>{props.children}</main>
    </div>
  );
};

function App() {
  return () => (
    <Layout header={<h1>My App</h1>}>
      <p>Content goes here</p>
    </Layout>
  );
}
```

## Ref Types

Type refs correctly:

```tsx
function Example() {
  const inputRef = createRef<HTMLInputElement>();
  const divRef = createRef<HTMLDivElement>();

  const focus = () => {
    inputRef.current?.focus();
  };

  return () => (
    <div ref={divRef}>
      <input ref={inputRef} type="text" />
      <button onClick={focus}>Focus</button>
    </div>
  );
}
```

## Tips

1. **Let TypeScript infer** - In most cases, TypeScript will infer types correctly
2. **Explicit when needed** - Add explicit types for complex state or when inference fails
3. **Use interfaces** - Define interfaces for reusable types
4. **Component type** - Use the `Component` type for component definitions
5. **Avoid `any`** - Use proper types to maintain type safety
