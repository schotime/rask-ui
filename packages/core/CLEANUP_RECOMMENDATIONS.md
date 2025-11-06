# Async Operations Cleanup - Implementation Guide

## Problem

Currently, `createQuery` and `createMutation` hold AbortController references in closures that are never cleaned up. This can lead to memory leaks in long-running applications.

## Solution

Add `abort()` and `dispose()` methods to the Query and Mutation types.

---

## Implementation

### 1. Update `createQuery` (src/createQuery.ts)

```typescript
export type Query<T> = QueryState<T> & {
  fetch(force?: boolean): void;
  abort(): void;      // NEW
  dispose(): void;    // NEW
};

export function createQuery<T>(fetcher: () => Promise<T>): Query<T> {
  const state = createState<QueryState<T>>({
    isPending: true,
    data: null,
    error: null,
  });
  const assign = (newState: QueryState<T>) => {
    Object.assign(state, newState);
  };

  let currentAbortController: AbortController | undefined;

  const fetch = () => {
    currentAbortController?.abort();

    const abortController = (currentAbortController = new AbortController());

    fetcher()
      .then((data) => {
        if (abortController.signal.aborted) {
          return;
        }

        assign({
          isPending: false,
          data,
          error: null,
        });
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        assign({
          isPending: false,
          data: null,
          error: String(error),
        });
      });
  };

  fetch();

  return {
    get isPending() {
      return state.isPending;
    },
    get data() {
      return state.data;
    },
    get error() {
      return state.error;
    },
    fetch(force) {
      assign({
        isPending: true,
        data: force ? null : state.data,
        error: null,
      });
      fetch();
    },
    // NEW: Abort ongoing request
    abort() {
      currentAbortController?.abort();
    },
    // NEW: Full cleanup - abort and clear state
    dispose() {
      currentAbortController?.abort();
      currentAbortController = undefined;
    },
  } as Query<T>;
}
```

---

### 2. Update `createMutation` (src/createMutation.ts)

```typescript
export type Mutation<T> = MutationState<T> & {
  mutate(params?: T): void;
  abort(): void;      // NEW
  dispose(): void;    // NEW
};

export function createMutation<T>(
  mutator: (params: T) => Promise<T>
): Mutation<T> {
  const state = createState<MutationState<T>>({
    isPending: false,
    params: null,
    error: null,
  });
  const assign = (newState: MutationState<T>) => {
    Object.assign(state, newState);
  };

  let currentAbortController: AbortController | undefined;

  return {
    get isPending() {
      return state.isPending;
    },
    get params() {
      return state.params;
    },
    get error() {
      return state.error;
    },
    mutate(params: T) {
      currentAbortController?.abort();

      const abortController = (currentAbortController = new AbortController());

      assign({
        isPending: true,
        params,
        error: null,
      });

      mutator(params)
        .then(() => {
          if (abortController.signal.aborted) {
            return;
          }

          assign({
            isPending: false,
            params: null,
            error: null,
          });
        })
        .catch((error) => {
          if (abortController.signal.aborted) {
            return;
          }

          assign({
            isPending: false,
            params: null,
            error: String(error),
          });
        });
    },
    // NEW: Abort ongoing mutation
    abort() {
      currentAbortController?.abort();
    },
    // NEW: Full cleanup
    dispose() {
      currentAbortController?.abort();
      currentAbortController = undefined;
    },
  } as Mutation<T>;
}
```

---

## Usage Examples

### With Query:

```typescript
function UserProfile() {
  const userQuery = createQuery(() =>
    fetch('/api/user').then(r => r.json())
  );

  // Clean up on unmount
  onCleanup(() => {
    userQuery.dispose();
  });

  return () => (
    <div>
      {userQuery.isPending && <div>Loading...</div>}
      {userQuery.data && <div>Hello {userQuery.data.name}</div>}
    </div>
  );
}
```

### With Mutation:

```typescript
function UpdateProfile() {
  const updateMutation = createMutation((data) =>
    fetch('/api/user', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  );

  onCleanup(() => {
    updateMutation.dispose();
  });

  return () => (
    <form onSubmit={(e) => {
      e.preventDefault();
      updateMutation.mutate({ name: 'New Name' });
    }}>
      <button type="submit" disabled={updateMutation.isPending}>
        {updateMutation.isPending ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}
```

### Manual Abort (Without Unmount):

```typescript
function SearchResults() {
  const searchQuery = createQuery(() =>
    fetch(`/api/search?q=${searchTerm}`)
  );

  return () => (
    <div>
      <button onClick={() => searchQuery.abort()}>
        Cancel Search
      </button>
      <button onClick={() => searchQuery.dispose()}>
        Clear & Stop
      </button>
    </div>
  );
}
```

---

## Why This Matters

### Without Cleanup:
1. Component unmounts while fetch is in-flight
2. Promise continues to run
3. AbortController stays in memory
4. State updates attempted on unmounted component
5. Memory leak accumulates over time

### With Cleanup:
1. Component unmount calls `onCleanup`
2. `query.dispose()` aborts the request
3. Promise chain terminates early
4. AbortController is released
5. Memory is freed properly

---

## Testing

Add tests to verify cleanup works:

```typescript
it('should clean up when disposed', () => {
  let aborted = false;
  const fetcher = () => new Promise((resolve, reject) => {
    const ac = new AbortController();
    ac.signal.addEventListener('abort', () => {
      aborted = true;
      reject(new Error('Aborted'));
    });
  });

  const query = createQuery(fetcher);
  query.dispose();

  expect(aborted).toBe(true);
});
```

---

## Documentation to Add

Update README with:

### Best Practices Section:

```markdown
## Memory Management

Always clean up queries and mutations when components unmount:

\`\`\`typescript
function MyComponent() {
  const query = createQuery(fetcher);

  onCleanup(() => query.dispose());

  return () => <div>{query.data}</div>;
}
\`\`\`

This prevents memory leaks from pending requests.
```

---

## Alternative: Automatic Cleanup

You could also make cleanup automatic by registering the query/mutation with the component system:

```typescript
export function createQuery<T>(fetcher: () => Promise<T>): Query<T> {
  // ... existing code ...

  const component = getCurrentComponent();
  if (component) {
    component.onCleanups.push(() => {
      currentAbortController?.abort();
    });
  }

  return { /* ... */ };
}
```

This way users don't need to manually call `dispose()`, but it's less explicit. Consider adding this as an option with a flag like `autoCleanup: true`.
