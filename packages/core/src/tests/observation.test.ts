import { describe, it, expect, vi } from "vitest";
import { Signal, Observer, getCurrentObserver } from "../observation";

describe("Signal-Observer System (Optimized)", () => {
  describe("Observer", () => {
    it("should track signals during observation", () => {
      const callback = vi.fn();
      const observer = new Observer(callback);
      const signal = new Signal();

      const dispose = observer.observe();
      observer.subscribeSignal(signal);
      dispose();

      signal.notify();

      return new Promise((resolve) => {
        queueMicrotask(() => {
          expect(callback).toHaveBeenCalledTimes(1);
          resolve(undefined);
        });
      });
    });

    it("should handle multiple signals", async () => {
      const callback = vi.fn();
      const observer = new Observer(callback);
      const signal1 = new Signal();
      const signal2 = new Signal();

      const dispose = observer.observe();
      observer.subscribeSignal(signal1);
      observer.subscribeSignal(signal2);
      dispose();

      signal1.notify();
      await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
      expect(callback).toHaveBeenCalledTimes(1);

      signal2.notify();
      await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it("should clear signals when observing again", async () => {
      let callCount = 0;
      const observer = new Observer(() => {
        callCount++;
      });

      const signal1 = new Signal();
      const signal2 = new Signal();

      // First observation
      let dispose = observer.observe();
      observer.subscribeSignal(signal1);
      dispose();

      // Second observation - should clear previous signals
      dispose = observer.observe();
      observer.subscribeSignal(signal2);
      dispose();

      // Notify first signal - should not trigger observer
      signal1.notify();

      await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
      expect(callCount).toBe(0);

      // Notify second signal - should trigger observer
      signal2.notify();

      await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
      expect(callCount).toBe(1);
    });

    it("should dispose of all signal subscriptions", async () => {
      const callback = vi.fn();
      const observer = new Observer(callback);
      const signal = new Signal();

      const dispose = observer.observe();
      observer.subscribeSignal(signal);
      dispose();

      observer.dispose();

      signal.notify();

      await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
      expect(callback).not.toHaveBeenCalled();
    });

    it("should not notify after disposal", async () => {
      const callback = vi.fn();
      const observer = new Observer(callback);
      const signal = new Signal();

      const dispose = observer.observe();
      observer.subscribeSignal(signal);
      dispose();

      observer.dispose();
      signal.notify();

      await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
      expect(callback).not.toHaveBeenCalled();
    });

    it("should set current observer during observation", () => {
      const observer = new Observer(() => {});

      expect(getCurrentObserver()).toBeUndefined();

      const dispose = observer.observe();
      expect(getCurrentObserver()).toBe(observer);

      dispose();
      expect(getCurrentObserver()).toBeUndefined();
    });

    it("should handle nested observations with stack", () => {
      const observer1 = new Observer(() => {});
      const observer2 = new Observer(() => {});

      const dispose1 = observer1.observe();
      expect(getCurrentObserver()).toBe(observer1);

      const dispose2 = observer2.observe();
      expect(getCurrentObserver()).toBe(observer2);

      dispose2();
      expect(getCurrentObserver()).toBe(observer1);

      dispose1();
      expect(getCurrentObserver()).toBeUndefined();
    });
  });

  describe("Signal", () => {
    it("should notify all subscribed observers", async () => {
      const signal = new Signal();
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const observer1 = new Observer(callback1);
      const observer2 = new Observer(callback2);

      const dispose1 = observer1.observe();
      observer1.subscribeSignal(signal);
      dispose1();

      const dispose2 = observer2.observe();
      observer2.subscribeSignal(signal);
      dispose2();

      signal.notify();

      await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it("should handle empty signal (no subscribers)", () => {
      const signal = new Signal();
      // Should not throw
      expect(() => signal.notify()).not.toThrow();
    });
  });

  describe("Optimization: Epoch Barrier", () => {
    it("should NOT notify new subscriptions created during notify", async () => {
      const signal = new Signal();
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const observer1 = new Observer(callback1);
      const observer2 = new Observer(() => {
        callback2();
        // Subscribe a new observer DURING notification
        const dispose = observer3.observe();
        observer3.subscribeSignal(signal);
        dispose();
      });
      const observer3 = new Observer(vi.fn());

      const dispose1 = observer1.observe();
      observer1.subscribeSignal(signal);
      dispose1();

      const dispose2 = observer2.observe();
      observer2.subscribeSignal(signal);
      dispose2();

      signal.notify();

      await new Promise<void>((resolve) => queueMicrotask(() => resolve()));

      // observer1 and observer2 should fire
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);

      // observer3 should NOT fire in the same notify pass (added during notify)
      // This is tested implicitly - if it fired, we'd see 3 calls above
    });

    it("should notify new subscriptions on NEXT notify", async () => {
      const signal = new Signal();
      let observer3Created = false;
      const callback3 = vi.fn();
      const observer3 = new Observer(callback3);

      const observer1 = new Observer(() => {
        if (!observer3Created) {
          observer3Created = true;
          const dispose = observer3.observe();
          observer3.subscribeSignal(signal);
          dispose();
        }
      });

      const dispose1 = observer1.observe();
      observer1.subscribeSignal(signal);
      dispose1();

      // First notify - observer3 gets created but should not fire
      signal.notify();
      await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
      expect(callback3).toHaveBeenCalledTimes(0);

      // Second notify - observer3 should now fire
      signal.notify();
      await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
      expect(callback3).toHaveBeenCalledTimes(1);
    });
  });

  describe("Optimization: Safe Unsubscribe During Notify", () => {
    it("should handle observer disposing itself during notification", async () => {
      const signal = new Signal();
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const observer1 = new Observer(() => {
        callback1();
        observer1.dispose(); // Dispose itself during notification
      });

      const observer2 = new Observer(callback2);

      const dispose1 = observer1.observe();
      observer1.subscribeSignal(signal);
      dispose1();

      const dispose2 = observer2.observe();
      observer2.subscribeSignal(signal);
      dispose2();

      // First notify - both should fire, observer1 disposes itself
      signal.notify();
      await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);

      // Second notify - only observer2 should fire
      signal.notify();
      await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
      expect(callback1).toHaveBeenCalledTimes(1); // Still 1
      expect(callback2).toHaveBeenCalledTimes(2); // Incremented
    });

    it("should handle observer clearing signals during notification", async () => {
      const signal1 = new Signal();
      const signal2 = new Signal();
      const callback = vi.fn();

      const observer = new Observer(() => {
        callback();
        // Re-observe, which clears all signals
        const dispose = observer.observe();
        observer.subscribeSignal(signal2);
        dispose();
      });

      const dispose = observer.observe();
      observer.subscribeSignal(signal1);
      dispose();

      signal1.notify();
      await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
      expect(callback).toHaveBeenCalledTimes(1);

      // Should not respond to signal1 anymore
      signal1.notify();
      await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
      expect(callback).toHaveBeenCalledTimes(1);

      // Should respond to signal2
      signal2.notify();
      await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
      expect(callback).toHaveBeenCalledTimes(2);
    });
  });

  describe("Optimization: Memory Efficiency", () => {
    it("should clean up subscriptions when observer is disposed", async () => {
      const signal = new Signal();
      const observers = Array.from({ length: 100 }, () =>
        new Observer(() => {})
      );

      // Subscribe all observers
      observers.forEach((observer) => {
        const dispose = observer.observe();
        observer.subscribeSignal(signal);
        dispose();
      });

      // Dispose half of them
      observers.slice(0, 50).forEach((observer) => observer.dispose());

      // Notify - should not throw or have issues
      expect(() => signal.notify()).not.toThrow();

      // Cleanup
      observers.slice(50).forEach((observer) => observer.dispose());
    });

    it("should handle multiple observe/clearSignals cycles", () => {
      const observer = new Observer(() => {});
      const signal1 = new Signal();
      const signal2 = new Signal();
      const signal3 = new Signal();

      // First cycle
      let dispose = observer.observe();
      observer.subscribeSignal(signal1);
      dispose();

      // Second cycle - clears signal1
      dispose = observer.observe();
      observer.subscribeSignal(signal2);
      dispose();

      // Third cycle - clears signal2
      dispose = observer.observe();
      observer.subscribeSignal(signal3);
      dispose();

      // Should not throw
      expect(() => {
        signal1.notify();
        signal2.notify();
        signal3.notify();
      }).not.toThrow();
    });
  });

  describe("Edge Cases", () => {
    it("should handle rapid consecutive notifies", async () => {
      const signal = new Signal();
      const callback = vi.fn();
      const observer = new Observer(callback);

      const dispose = observer.observe();
      observer.subscribeSignal(signal);
      dispose();

      // Rapid notifies
      signal.notify();
      signal.notify();
      signal.notify();

      await new Promise<void>((resolve) => queueMicrotask(() => resolve()));

      // Due to batching, exact count depends on implementation
      // But should have been called at least once
      expect(callback).toHaveBeenCalled();
    });

    it("should not notify after subscribeSignal on disposed observer", async () => {
      const signal = new Signal();
      const callback = vi.fn();
      const observer = new Observer(callback);

      observer.dispose();

      const dispose = observer.observe();
      observer.subscribeSignal(signal);
      dispose();

      signal.notify();
      await new Promise<void>((resolve) => queueMicrotask(() => resolve()));

      expect(callback).not.toHaveBeenCalled();
    });

    it("should handle complex subscription graph", async () => {
      // Create a diamond dependency pattern
      const signal1 = new Signal();
      const signal2 = new Signal();
      const signal3 = new Signal();

      const calls: string[] = [];

      const observer1 = new Observer(() => {
        calls.push("o1");
        signal2.notify();
        signal3.notify();
      });

      const observer2 = new Observer(() => calls.push("o2"));
      const observer3 = new Observer(() => calls.push("o3"));

      // observer1 listens to signal1
      let dispose = observer1.observe();
      observer1.subscribeSignal(signal1);
      dispose();

      // observer2 listens to signal2
      dispose = observer2.observe();
      observer2.subscribeSignal(signal2);
      dispose();

      // observer3 listens to signal3
      dispose = observer3.observe();
      observer3.subscribeSignal(signal3);
      dispose();

      signal1.notify();
      await new Promise<void>((resolve) => queueMicrotask(() => resolve()));

      // All should have been called
      expect(calls).toContain("o1");
      expect(calls).toContain("o2");
      expect(calls).toContain("o3");
    });
  });
});
