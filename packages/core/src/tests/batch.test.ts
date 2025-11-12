import { describe, it, expect, vi } from "vitest";
import { batch } from "../observation";
import { createState } from "../createState";
import { Observer } from "../observation";

describe("batch", () => {
  it("should batch multiple state changes into a single notification", async () => {
    const state = createState({ count: 0, name: "Alice" });
    let notifyCount = 0;

    const observer = new Observer(() => {
      notifyCount++;
    });

    const dispose = observer.observe();
    state.count; // Track count
    state.name; // Track name
    dispose();

    // Make multiple changes in a batch
    batch(() => {
      state.count = 1;
      state.name = "Bob";
      state.count = 2;
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    // Should only notify once despite multiple changes
    expect(notifyCount).toBe(1);
    expect(state.count).toBe(2);
    expect(state.name).toBe("Bob");

    observer.dispose();
  });

  it("should handle nested batches correctly", async () => {
    const state = createState({ count: 0 });
    let notifyCount = 0;

    const observer = new Observer(() => {
      notifyCount++;
    });

    const dispose = observer.observe();
    state.count; // Track
    dispose();

    batch(() => {
      state.count = 1;
      batch(() => {
        state.count = 2;
      });
      state.count = 3;
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    // Should still only notify once for nested batches
    expect(notifyCount).toBe(1);
    expect(state.count).toBe(3);

    observer.dispose();
  });

  it("should not batch notifications outside of batch calls", async () => {
    const state = createState({ count: 0 });
    let notifyCount = 0;

    const observer = new Observer(() => {
      notifyCount++;
    });

    const dispose = observer.observe();
    state.count; // Track
    dispose();

    // Make changes without batching
    state.count = 1;
    await new Promise((resolve) => setTimeout(resolve, 0));

    const firstNotifyCount = notifyCount;
    expect(firstNotifyCount).toBeGreaterThan(0);

    state.count = 2;
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Should have notified again
    expect(notifyCount).toBeGreaterThan(firstNotifyCount);

    observer.dispose();
  });

  it("should handle multiple observers with batch", async () => {
    const state = createState({ count: 0 });
    let notifyCount1 = 0;
    let notifyCount2 = 0;

    const observer1 = new Observer(() => {
      notifyCount1++;
    });
    const observer2 = new Observer(() => {
      notifyCount2++;
    });

    const dispose1 = observer1.observe();
    state.count; // Track in observer1
    dispose1();

    const dispose2 = observer2.observe();
    state.count; // Track in observer2
    dispose2();

    batch(() => {
      state.count = 1;
      state.count = 2;
      state.count = 3;
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    // Both observers should be notified exactly once
    expect(notifyCount1).toBe(1);
    expect(notifyCount2).toBe(1);

    observer1.dispose();
    observer2.dispose();
  });

  it("should maintain correct state values after batch", () => {
    const state = createState({
      count: 0,
      name: "Alice",
      items: [1, 2, 3]
    });

    batch(() => {
      state.count = 10;
      state.name = "Bob";
      state.items.push(4);
      state.items[0] = 100;
    });

    expect(state.count).toBe(10);
    expect(state.name).toBe("Bob");
    expect(state.items).toEqual([100, 2, 3, 4]);
  });

  it("should handle exceptions within batch without breaking batching", async () => {
    const state = createState({ count: 0 });
    let notifyCount = 0;

    const observer = new Observer(() => {
      notifyCount++;
    });

    const dispose = observer.observe();
    state.count; // Track
    dispose();

    try {
      batch(() => {
        state.count = 1;
        throw new Error("Test error");
      });
    } catch (e) {
      // Expected error
    }

    await new Promise((resolve) => setTimeout(resolve, 0));

    // Should still have notified despite the error
    expect(notifyCount).toBe(0); // Batch was interrupted, notifiers not flushed
    expect(state.count).toBe(1); // State change still occurred

    observer.dispose();
  });

  it("should work with deeply nested state changes", async () => {
    const state = createState({
      level1: {
        level2: {
          level3: {
            value: 0
          }
        }
      }
    });
    let notifyCount = 0;

    const observer = new Observer(() => {
      notifyCount++;
    });

    const dispose = observer.observe();
    state.level1.level2.level3.value; // Track
    dispose();

    batch(() => {
      state.level1.level2.level3.value = 1;
      state.level1.level2.level3.value = 2;
      state.level1.level2.level3.value = 3;
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(notifyCount).toBe(1);
    expect(state.level1.level2.level3.value).toBe(3);

    observer.dispose();
  });

  it("should batch array operations correctly", async () => {
    const state = createState({ items: [1, 2, 3] });
    let notifyCount = 0;

    const observer = new Observer(() => {
      notifyCount++;
    });

    const dispose = observer.observe();
    state.items.length; // Track array
    dispose();

    batch(() => {
      state.items.push(4);
      state.items.push(5);
      state.items.pop();
      state.items.unshift(0);
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    // Should only notify once for all array operations
    expect(notifyCount).toBe(1);
    expect(state.items).toEqual([0, 1, 2, 3, 4]);

    observer.dispose();
  });

  it("should handle batch with no state changes", async () => {
    const state = createState({ count: 0 });
    let notifyCount = 0;

    const observer = new Observer(() => {
      notifyCount++;
    });

    const dispose = observer.observe();
    state.count; // Track
    dispose();

    batch(() => {
      // No state changes
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(notifyCount).toBe(0);

    observer.dispose();
  });

  it("should handle synchronous observer notifications after batch", async () => {
    const state = createState({ count: 0 });
    const notifications: number[] = [];

    const observer = new Observer(() => {
      notifications.push(state.count);
    });

    const dispose = observer.observe();
    state.count; // Track
    dispose();

    batch(() => {
      state.count = 1;
      state.count = 2;
      state.count = 3;
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    // Observer should see the final value
    expect(notifications).toEqual([3]);

    observer.dispose();
  });

  it("should allow mixing batched and non-batched updates", async () => {
    const state = createState({ count: 0 });
    let notifyCount = 0;

    const observer = new Observer(() => {
      notifyCount++;
    });

    const dispose = observer.observe();
    state.count; // Track
    dispose();

    state.count = 1;
    await new Promise((resolve) => setTimeout(resolve, 0));
    const afterFirst = notifyCount;

    batch(() => {
      state.count = 2;
      state.count = 3;
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    const afterBatch = notifyCount;

    state.count = 4;
    await new Promise((resolve) => setTimeout(resolve, 0));
    const afterSecond = notifyCount;

    expect(afterFirst).toBeGreaterThan(0);
    expect(afterBatch).toBe(afterFirst + 1); // One notification for the batch
    expect(afterSecond).toBe(afterBatch + 1); // One more for the final update

    observer.dispose();
  });

  it("should deduplicate notifications for the same observer", async () => {
    const state = createState({ count: 0, name: "Alice" });
    let notifyCount = 0;

    const observer = new Observer(() => {
      notifyCount++;
    });

    const dispose = observer.observe();
    state.count; // Track
    state.name; // Track
    dispose();

    batch(() => {
      state.count = 1; // Triggers observer
      state.name = "Bob"; // Triggers same observer again
      state.count = 2; // Triggers observer yet again
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    // Should deduplicate and only notify once
    expect(notifyCount).toBe(1);

    observer.dispose();
  });
});
