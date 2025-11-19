import { describe, it, expect, vi } from "vitest";
import { createTask } from "../createTask";
import { render } from "../index";

describe("createTask", () => {
  describe("without parameters", () => {
    it("should auto-run on creation and start in idle state", () => {
      let task: any;
      function Component() {
        const promise = new Promise(() => {});
        task = createTask(() => promise);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      // Initial fetch() doesn't set isRunning, only run()/rerun() do
      expect(task.isRunning).toBe(false);
      expect(task.result).toBeNull();
      expect(task.error).toBeNull();
      expect(task.params).toBeNull();
    });

    it("should resolve to result state on success", async () => {
      let task: any;
      function Component() {
        task = createTask(() => Promise.resolve("success"));
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      // Task doesn't auto-run anymore
      expect(task.isRunning).toBe(false);

      task.run();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(task.isRunning).toBe(false);
      expect(task.result).toBe("success");
      expect(task.error).toBeNull();
      expect(task.params).toBeNull();
    });

    it("should resolve to error state on rejection", async () => {
      let task: any;
      function Component() {
        task = createTask(() => Promise.reject(new Error("failed")));
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      task.run();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(task.isRunning).toBe(false);
      expect(task.result).toBeNull();
      expect(task.error).toContain("failed");
      expect(task.params).toBeNull();
    });

    it("should handle run() method", async () => {
      const fetcher = vi.fn(() => Promise.resolve("data"));
      let task: any;
      function Component() {
        task = createTask(fetcher);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      // Tasks no longer auto-run, so fetcher hasn't been called yet
      expect(fetcher).toHaveBeenCalledTimes(0);

      task.run();
      expect(task.isRunning).toBe(true);
      expect(task.result).toBeNull(); // Cleared on run

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(task.result).toBe("data");
    });

    it("should handle rerun() method", async () => {
      const fetcher = vi
        .fn()
        .mockResolvedValueOnce("data1")
        .mockResolvedValueOnce("data2");

      let task: any;
      function Component() {
        task = createTask(fetcher);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      // First run
      task.run();
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(task.result).toBe("data1");

      task.rerun();
      expect(task.isRunning).toBe(true);
      expect(task.result).toBe("data1"); // Kept during rerun

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(task.result).toBe("data2");
    });
  });

  describe("with parameters", () => {
    it("should not auto-run on creation", () => {
      const fetcher = vi.fn((page: number) => Promise.resolve(`page-${page}`));
      let task: any;
      function Component() {
        task = createTask(fetcher);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      // Tasks no longer auto-run
      expect(task.isRunning).toBe(false);
      expect(task.result).toBeNull();
      expect(task.error).toBeNull();
      expect(task.params).toBeNull();
      expect(fetcher).toHaveBeenCalledTimes(0);
    });

    it("should run when run() is called with params", async () => {
      const fetcher = vi.fn((page: number) => Promise.resolve(`page-${page}`));
      let task: any;
      function Component() {
        task = createTask(fetcher);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      task.run(1);

      expect(task.isRunning).toBe(true);
      expect(task.params).toBe(1);
      expect(task.result).toBeNull();
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(fetcher.mock.calls[0][0]).toBe(1);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(task.isRunning).toBe(false);
      expect(task.result).toBe("page-1");
      expect(task.params).toBeNull();
    });

    it("should handle error state with params", async () => {
      let task: any;
      function Component() {
        task = createTask<number, any>((id: number) =>
          Promise.reject(new Error(`failed-${id}`))
        );
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      task.run(42);

      expect(task.isRunning).toBe(true);
      expect(task.params).toBe(42);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(task.isRunning).toBe(false);
      expect(task.result).toBeNull();
      expect(task.error).toContain("failed-42");
      expect(task.params).toBeNull();
    });

    it("should handle rerun with params", async () => {
      const fetcher = vi
        .fn()
        .mockResolvedValueOnce("data1")
        .mockResolvedValueOnce("data2");

      let task: any;
      function Component() {
        task = createTask((page: number) => fetcher());
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      // First run
      task.run(1);
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(task.result).toBe("data1");

      task.rerun(1);
      expect(task.isRunning).toBe(true);
      expect(task.result).toBe("data1"); // Kept during rerun
      expect(task.params).toBe(1);

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(task.result).toBe("data2");
    });

    it("should update params when running with different values", async () => {
      let task: any;
      function Component() {
        task = createTask((page: number) =>
          Promise.resolve(`page-${page}`)
        );
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      task.run(1);
      expect(task.params).toBe(1);

      await new Promise((resolve) => setTimeout(resolve, 10));

      task.run(2);
      expect(task.params).toBe(2);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(task.result).toBe("page-2");
    });
  });

  describe("cancellation", () => {
    it("should cancel previous request when run again", async () => {
      let resolveFirst: (value: string) => void;
      let resolveSecond: (value: string) => void;

      const firstPromise = new Promise<string>((resolve) => {
        resolveFirst = resolve;
      });
      const secondPromise = new Promise<string>((resolve) => {
        resolveSecond = resolve;
      });

      const fetcher = vi
        .fn()
        .mockReturnValueOnce(firstPromise)
        .mockReturnValueOnce(secondPromise);

      let task: any;
      function Component() {
        task = createTask(fetcher);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      // First run
      task.run();
      expect(task.isRunning).toBe(true);

      // Trigger second run before first completes - this cancels the first run
      task.run();
      expect(task.isRunning).toBe(true);

      // Resolve first (should be ignored due to cancellation)
      resolveFirst!("first");
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(task.result).toBeNull(); // First result ignored

      // Resolve second
      resolveSecond!("second");
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(task.result).toBe("second");
    });

    it("should cancel previous request with params", async () => {
      let resolveFirst: (value: string) => void;
      let resolveSecond: (value: string) => void;

      const firstPromise = new Promise<string>((resolve) => {
        resolveFirst = resolve;
      });
      const secondPromise = new Promise<string>((resolve) => {
        resolveSecond = resolve;
      });

      const fetcher = vi
        .fn()
        .mockReturnValueOnce(firstPromise)
        .mockReturnValueOnce(secondPromise);

      let task: any;
      function Component() {
        task = createTask((page: number) => fetcher());
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      task.run(1);
      expect(task.params).toBe(1);

      // Trigger second run before first completes
      task.run(2);
      expect(task.params).toBe(2);

      // Resolve first (should be ignored due to cancellation)
      resolveFirst!("first");
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(task.result).toBeNull(); // First result ignored

      // Resolve second
      resolveSecond!("second");
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(task.result).toBe("second");
    });

    it("should handle rapid successive runs", async () => {
      let counter = 0;
      const fetcher = vi.fn(() => Promise.resolve(`data-${++counter}`));
      let task: any;
      function Component() {
        task = createTask(fetcher);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      // Rapid runs
      task.run();
      task.run();
      task.run();

      await new Promise((resolve) => setTimeout(resolve, 20));

      // Only the last run should complete
      expect(fetcher).toHaveBeenCalledTimes(3); // 3 runs
      expect(task.result).toBe("data-3");
    });
  });

  describe("type handling", () => {
    it("should handle numeric values", async () => {
      let task: any;
      function Component() {
        task = createTask(() => Promise.resolve(42));
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      task.run();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(task.result).toBe(42);
    });

    it("should handle object values", async () => {
      const data = { id: 1, name: "Test" };
      let task: any;
      function Component() {
        task = createTask(() => Promise.resolve(data));
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      task.run();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(task.result).toEqual(data);
    });

    it("should handle array values", async () => {
      const data = [1, 2, 3, 4, 5];
      let task: any;
      function Component() {
        task = createTask(() => Promise.resolve(data));
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      task.run();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(task.result).toEqual(data);
    });

    it("should convert error to string", async () => {
      let task: any;
      function Component() {
        task = createTask(() => Promise.reject("string error"));
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      task.run();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(typeof task.error).toBe("string");
      expect(task.error).toBe("string error");
    });

    it("should handle error objects", async () => {
      const error = new Error("Something went wrong");
      let task: any;
      function Component() {
        task = createTask(() => Promise.reject(error));
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      task.run();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(task.error).toContain("Something went wrong");
    });

    it("should handle different parameter types", async () => {
      const fetcher = vi.fn((params) => Promise.resolve(params));

      // Object params
      let task1: any;
      function Component1() {
        task1 = createTask(fetcher);
        return () => <div>test</div>;
      }

      const container1 = document.createElement("div");
      render(<Component1 />, container1);

      task1.run({ id: 1, name: "test" } as any);
      expect(task1.params).toEqual({ id: 1, name: "test" });

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Array params
      let task2: any;
      function Component2() {
        task2 = createTask(fetcher);
        return () => <div>test</div>;
      }

      const container2 = document.createElement("div");
      render(<Component2 />, container2);

      task2.run([1, 2, 3] as any);
      expect(task2.params).toEqual([1, 2, 3]);

      await new Promise((resolve) => setTimeout(resolve, 10));

      // String params
      let task3: any;
      function Component3() {
        task3 = createTask((str: string) => Promise.resolve(str));
        return () => <div>test</div>;
      }

      const container3 = document.createElement("div");
      render(<Component3 />, container3);

      task3.run("test");
      expect(task3.params).toBe("test");
    });
  });

  describe("edge cases", () => {
    it("should handle immediate resolution", async () => {
      let task: any;
      function Component() {
        task = createTask(() => Promise.resolve("immediate"));
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      task.run();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(task.isRunning).toBe(false);
      expect(task.result).toBe("immediate");
    });

    it("should handle immediate rejection", async () => {
      let task: any;
      function Component() {
        task = createTask(() => Promise.reject("immediate error"));
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      task.run();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(task.isRunning).toBe(false);
      expect(task.error).toBe("immediate error");
    });

    it("should handle delayed resolution", async () => {
      let task: any;
      function Component() {
        task = createTask(
          () =>
            new Promise((resolve) => {
              setTimeout(() => resolve("delayed"), 10);
            })
        );
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      task.run();
      expect(task.isRunning).toBe(true);

      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(task.isRunning).toBe(false);
      expect(task.result).toBe("delayed");
    });

    it("should clear error on successful retry", async () => {
      const fetcher = vi
        .fn()
        .mockRejectedValueOnce(new Error("First error"))
        .mockResolvedValueOnce("success");

      let task: any;
      function Component() {
        task = createTask(fetcher);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      task.run();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(task.error).toContain("First error");
      expect(task.result).toBeNull();

      task.run();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(task.error).toBeNull();
      expect(task.result).toBe("success");
    });
  });

  describe("reactive getters", () => {
    it("should expose reactive getters", async () => {
      let task: any;
      function Component() {
        task = createTask(() => Promise.resolve("data"));
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      task.run();

      // Access getters before completion
      const running1 = task.isRunning;
      const result1 = task.result;
      const error1 = task.error;
      const params1 = task.params;

      expect(running1).toBe(true);
      expect(result1).toBeNull();
      expect(error1).toBeNull();
      expect(params1).toBeNull();

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Access getters after completion
      expect(task.isRunning).toBe(false);
      expect(task.result).toBe("data");
      expect(task.error).toBeNull();
      expect(task.params).toBeNull();
    });

    it("should track params during execution", async () => {
      let task: any;
      function Component() {
        task = createTask(
          (id: number) =>
            new Promise((resolve) =>
              setTimeout(() => resolve(`result-${id}`), 20)
            )
        );
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      task.run(123);

      expect(task.isRunning).toBe(true);
      expect(task.params).toBe(123);

      await new Promise((resolve) => setTimeout(resolve, 30));

      expect(task.isRunning).toBe(false);
      expect(task.params).toBeNull();
    });
  });
});
