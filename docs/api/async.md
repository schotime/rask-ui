# Async Data Management

Functions for managing asynchronous operations with loading, error, and result states.

## createTask()

Creates a low-level reactive primitive for managing async operations with loading, error, and result states. This is a generic primitive that gives you full control over async state management without prescribing patterns.

```tsx
// Task without parameters - auto-runs on creation
createTask<T>(task: () => Promise<T>): Task<T, never>

// Task with parameters - manual control
createTask<T, P>(task: (params: P) => Promise<T>): Task<T, P>
```

### Parameters

- `task: () => Promise<T>` - Async function without parameters (auto-runs on creation)
- `task: (params: P) => Promise<T>` - Async function with parameters (manual control)

### Returns

Task object with reactive state and methods:

**State Properties:**
- `isRunning: boolean` - True while task is executing
- `result: T | null` - Result of successful execution (null if not yet run, running, or error)
- `error: string | null` - Error message from failed execution (null if successful or running)
- `params: P | null` - Current parameters while running (null when idle)

**Methods:**
- `run(params?: P): Promise<T>` - Execute the task, clearing previous result
- `rerun(params?: P): Promise<T>` - Re-execute the task, keeping previous result until new one arrives

### State Transitions

Initial state (no params):
```tsx
{ isRunning: false, params: null, result: null, error: null }
```

While running:
```tsx
{ isRunning: true, result: T | null, params: P, error: null }
```

Success:
```tsx
{ isRunning: false, params: null, result: T, error: null }
```

Error:
```tsx
{ isRunning: false, params: null, result: null, error: string }
```

### Examples

#### Simple Task (Auto-run)

Tasks without parameters run automatically on creation:

```tsx
import { createTask } from "rask-ui";

function UserProfile() {
  const user = createTask(() => fetch("/api/user").then((r) => r.json()));

  return () => {
    if (user.isRunning) {
      return <p>Loading...</p>;
    }

    if (user.error) {
      return <p>Error: {user.error}</p>;
    }

    return <p>Hello, {user.result.name}!</p>;
  };
}
```

#### Task with Parameters (Manual Control)

Tasks with parameters must be called explicitly:

```tsx
function Posts() {
  const posts = createTask((page: number) =>
    fetch(`/api/posts?page=${page}`).then((r) => r.json())
  );

  const renderPosts = () => {
    if (posts.isRunning) {
      return <p>Loading...</p>;
    }

    if (posts.error) {
      return <p>Error: {posts.error}</p>;
    }

    if (!posts.result) {
      return <p>No posts loaded</p>;
    }

    return posts.result.map((post) => (
      <article key={post.id}>{post.title}</article>
    ));
  };

  return () => (
    <div>
      <button onClick={() => posts.run(1)}>Load Page 1</button>
      <button onClick={() => posts.rerun(1)}>Reload Page 1</button>
      {renderPosts()}
    </div>
  );
}
```

#### Mutation-Style Usage

Use tasks for mutations by calling them with data:

```tsx
function CreatePost() {
  const state = createState({ title: "", body: "" });

  const create = createTask((data: { title: string; body: string }) =>
    fetch("/api/posts", {
      method: "POST",
      body: JSON.stringify(data),
    }).then((r) => r.json())
  );

  const handleSubmit = () => {
    create.run({ title: state.title, body: state.body });
  };

  return () => (
    <form onSubmit={handleSubmit}>
      <input
        value={state.title}
        onInput={(e) => (state.title = e.target.value)}
      />
      <textarea
        value={state.body}
        onInput={(e) => (state.body = e.target.value)}
      />
      <button disabled={create.isRunning}>
        {create.isRunning ? "Creating..." : "Create"}
      </button>
      {create.error && <p>Error: {create.error}</p>}
    </form>
  );
}
```

### run() vs rerun()

- **`run(params)`** - Clears previous result before executing. Use when you want to show loading state without stale data.
- **`rerun(params)`** - Keeps previous result during execution. Use when you want to show old data while refreshing.

```tsx
function DataRefresh() {
  const data = createTask(() => fetch("/api/data").then((r) => r.json()));

  return () => (
    <div>
      {/* Clear data and show loading */}
      <button onClick={() => data.run()}>Refresh (clear)</button>

      {/* Keep showing old data while reloading */}
      <button onClick={() => data.rerun()}>Refresh (keep)</button>

      {data.isRunning && <p>Loading...</p>}
      {data.result && <pre>{JSON.stringify(data.result)}</pre>}
    </div>
  );
}
```

### Features

- **Automatic cancellation** - Previous executions are cancelled when a new one starts
- **Flexible control** - Use `run()` to clear old data or `rerun()` to keep it during loading
- **Type-safe** - Full TypeScript inference for parameters and results
- **Auto-run support** - Tasks without parameters run automatically on creation
- **Generic primitive** - Build your own patterns on top (queries, mutations, etc.)

### Usage Patterns

Use `createTask` as a building block for various async patterns:

- **Queries**: Tasks that fetch data and can be refetched
- **Mutations**: Tasks that modify server state
- **Polling**: Tasks that run periodically
- **Debounced searches**: Tasks that run based on user input
- **File uploads**: Tasks that track upload progress

#### Polling Example

```tsx
function LiveData() {
  const data = createTask(() => fetch("/api/live").then((r) => r.json()));

  createMountEffect(() => {
    const interval = setInterval(() => {
      data.rerun(); // Keep old data while refreshing
    }, 5000);

    return () => clearInterval(interval);
  });

  return () => (
    <div>
      {data.isRunning && <span>Updating...</span>}
      {data.result && <pre>{JSON.stringify(data.result)}</pre>}
    </div>
  );
}
```

#### Reactive Dependencies Example

```tsx
function UserPosts(props) {
  const posts = createTask((userId: number) =>
    fetch(`/api/users/${userId}/posts`).then((r) => r.json())
  );

  // Refetch when userId changes
  createEffect(() => {
    posts.run(props.userId);
  });

  return () => (
    <div>
      <button onClick={() => posts.rerun(props.userId)}>Refresh</button>
      {posts.isRunning && <p>Loading...</p>}
      {posts.result && posts.result.map(post => (
        <article key={post.id}>{post.title}</article>
      ))}
    </div>
  );
}
```

### Notes

::: warning Important
- Tasks without parameters run automatically on creation
- Tasks with parameters must be called explicitly via `run()` or `rerun()`
- Previous task executions are automatically cancelled when a new one starts
- **Do not destructure** - breaks reactivity (see core concepts)
- Error messages are automatically converted to strings
:::

## TypeScript Support

`createTask` is fully typed with automatic inference:

```tsx
interface User {
  id: number;
  name: string;
  email: string;
}

interface Post {
  id: number;
  title: string;
  body: string;
}

interface CreatePostData {
  title: string;
  body: string;
}

// Auto-run task
const user = createTask(() =>
  fetch("/api/user").then((r) => r.json() as Promise<User>)
);
// user.result is inferred as User | null

// Task with parameters
const posts = createTask((page: number) =>
  fetch(`/api/posts?page=${page}`).then((r) => r.json() as Promise<Post[]>)
);
// posts.params is inferred as number | null
// posts.result is inferred as Post[] | null

// Mutation task
const create = createTask((data: CreatePostData) =>
  fetch("/api/posts", {
    method: "POST",
    body: JSON.stringify(data),
  }).then((r) => r.json() as Promise<Post>)
);
// create.params is inferred as CreatePostData | null
// create.result is inferred as Post | null
```
