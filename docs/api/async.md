# Async Data Management

Functions for managing asynchronous operations with loading and error states.

## createAsync()

Creates reactive state for async operations with loading and error states.

```tsx
createAsync<T>(promise: Promise<T>): AsyncState<T>
```

### Parameters

- `promise: Promise<T>` - The promise to track

### Returns

Reactive object with:
- `isPending: boolean` - True while promise is pending
- `value: T | null` - Resolved value (null while pending or on error)
- `error: string | null` - Error message (null while pending or on success)

### States

- `{ isPending: true, value: null, error: null }` - Loading
- `{ isPending: false, value: T, error: null }` - Success
- `{ isPending: false, value: null, error: string }` - Error

### Example

```tsx
import { createAsync } from "rask-ui";

function UserProfile() {
  const user = createAsync(
    fetch("/api/user").then((r) => r.json())
  );

  return () => {
    if (user.isPending) {
      return <p>Loading...</p>;
    }

    if (user.error) {
      return <p>Error: {user.error}</p>;
    }

    return <p>Hello, {user.value.name}!</p>;
  };
}
```

### Notes

::: warning Important
- Promise executes immediately on creation
- State updates automatically as promise resolves/rejects
- **Do not destructure** - breaks reactivity
- Error message is the error converted to string
:::

---

## createQuery()

Creates a query with refetch capability and request cancellation.

```tsx
createQuery<T>(fetcher: () => Promise<T>): Query<T>
```

### Parameters

- `fetcher: () => Promise<T>` - Function that returns a promise

### Returns

Query object with:
- `isPending: boolean` - True while fetching
- `data: T | null` - Fetched data
- `error: string | null` - Error message
- `fetch(force?: boolean)` - Refetch data

### Example

```tsx
import { createQuery } from "rask-ui";

function Posts() {
  const posts = createQuery(() =>
    fetch("/api/posts").then((r) => r.json())
  );

  const renderPosts = () => {
    if (posts.isPending) {
      return <p>Loading...</p>;
    }

    if (posts.error) {
      return <p>Error: {posts.error}</p>;
    }

    return posts.data.map((post) => (
      <article key={post.id}>{post.title}</article>
    ));
  };

  return () => (
    <div>
      <button onClick={() => posts.fetch()}>Refresh</button>
      <button onClick={() => posts.fetch(true)}>Force Refresh</button>
      {renderPosts()}
    </div>
  );
}
```

### fetch() Method

Refetches the data with optional force parameter:

```tsx
posts.fetch(force?: boolean)
```

- `force: false` (default) - Keeps existing data while refetching
- `force: true` - Clears data before refetching

### Features

- **Automatic fetch** - Fetches on creation
- **Request cancellation** - Automatically cancels previous request on refetch
- **Keeps old data** - By default keeps data during refetch
- **Force refresh** - Option to clear data before refetch

### Use Cases

```tsx
// Fetch with dependencies
function UserPosts(props) {
  const posts = createQuery(() =>
    fetch(`/api/users/${props.userId}/posts`).then((r) => r.json())
  );

  return () => (
    <div>
      <button onClick={() => posts.fetch()}>Refresh</button>
      {/* Render posts */}
    </div>
  );
}

// Polling
function LiveData() {
  const data = createQuery(() =>
    fetch("/api/live").then((r) => r.json())
  );

  createMountEffect(() => {
    const interval = setInterval(() => {
      data.fetch();
    }, 5000);

    return () => clearInterval(interval);
  });

  return () => <div>{data.data}</div>;
}
```

### Notes

::: warning Important
- Fetcher is called immediately on creation
- Previous requests are automatically cancelled
- **Do not destructure** - breaks reactivity
:::

---

## createMutation()

Creates a mutation for data updates with pending and error states.

```tsx
createMutation<T>(mutator: (params: T) => Promise<any>): Mutation<T>
```

### Parameters

- `mutator: (params: T) => Promise<any>` - Function that performs the mutation

### Returns

Mutation object with:
- `isPending: boolean` - True while mutation is in progress
- `params: T | null` - Current mutation parameters
- `error: string | null` - Error message
- `mutate(params: T)` - Execute the mutation

### Example

```tsx
import { createMutation, createState } from "rask-ui";

function CreatePost() {
  const state = createState({ title: "", body: "" });

  const create = createMutation((data) =>
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
      <textarea
        value={state.body}
        onInput={(e) => (state.body = e.target.value)}
      />
      <button disabled={create.isPending}>
        {create.isPending ? "Creating..." : "Create"}
      </button>
      {create.error && <p>Error: {create.error}</p>}
    </form>
  );
}
```

### mutate() Method

Executes the mutation with the provided parameters:

```tsx
mutation.mutate(params: T)
```

### Features

- **Request cancellation** - Automatically cancels if mutation called again
- **Tracks parameters** - Stores mutation parameters
- **Resets on success** - State resets after successful completion
- **Error handling** - Captures and displays errors

### Use Cases

```tsx
// With success callback
function DeletePost(props) {
  const deleteMutation = createMutation(async (id: number) => {
    await fetch(`/api/posts/${id}`, { method: "DELETE" });
  });

  createEffect(() => {
    if (!deleteMutation.isPending && !deleteMutation.error) {
      // Success - mutation completed
      props.onDeleted();
    }
  });

  return () => (
    <button
      onClick={() => deleteMutation.mutate(props.postId)}
      disabled={deleteMutation.isPending}
    >
      {deleteMutation.isPending ? "Deleting..." : "Delete"}
    </button>
  );
}

// With optimistic updates
function LikeButton(props) {
  const state = createState({ likes: props.initialLikes });

  const like = createMutation(async () => {
    await fetch(`/api/posts/${props.postId}/like`, { method: "POST" });
  });

  const handleLike = () => {
    // Optimistic update
    state.likes++;
    like.mutate();
  };

  // Revert on error
  createEffect(() => {
    if (like.error) {
      state.likes--;
    }
  });

  return () => (
    <button onClick={handleLike} disabled={like.isPending}>
      Likes: {state.likes}
    </button>
  );
}
```

### Notes

::: warning Important
- Mutation is not called automatically (unlike query)
- Previous request is cancelled if mutate() called again
- **Do not destructure** - breaks reactivity
- State resets after successful completion
:::

## TypeScript Support

All async functions are fully typed:

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

// Async
const user = createAsync<User>(
  fetch("/api/user").then((r) => r.json())
);

// Query
const posts = createQuery<Post[]>(() =>
  fetch("/api/posts").then((r) => r.json())
);

// Mutation
const create = createMutation<CreatePostData>((data) =>
  fetch("/api/posts", {
    method: "POST",
    body: JSON.stringify(data),
  })
);
```

## Comparison

| Feature | createAsync | createQuery | createMutation |
|---------|-------------|-------------|----------------|
| Auto-execute | ✅ Yes | ✅ Yes | ❌ No |
| Refetch | ❌ No | ✅ Yes | ✅ Yes (via mutate) |
| Cancellation | ❌ No | ✅ Yes | ✅ Yes |
| Use case | One-time fetch | Fetching data | Updating data |
| State | isPending, value, error | isPending, data, error | isPending, params, error |
