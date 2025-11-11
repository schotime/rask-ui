import { AbstractVNode, PatchOperation } from "./AbstractVNode";
import { VNode } from "./types";
import { ComponentInstance } from "./ComponentVNode";
import { flattenNodes } from "./dom-utils";

// Global reference to the currently executing root
// Safe because JS is single-threaded - only one render executes at a time
export let currentRoot: RootVNode | undefined;

export class RootVNode extends AbstractVNode {
  children: VNode[];
  componentStack: ComponentInstance[] = [];
  private lifecycleQueue = {
    toMount: [] as Array<() => void>,
    toUnmount: [] as Array<() => void>,
  };
  private hasPendingMicroTask: boolean = false;
  private pendingObservers: Array<() => void> = [];

  constructor(rootNode: VNode, container: HTMLElement) {
    super();
    this.elm = container;
    this.children = [rootNode];
  }

  queueMount(cb: () => void) {
    this.lifecycleQueue.toMount.push(cb);
  }

  queueUnmount(cb: () => void) {
    this.lifecycleQueue.toUnmount.push(cb);
  }
  queueObserver(cb: () => void) {
    this.pendingObservers.push(cb);
    if (!this.hasPendingMicroTask) {
      this.hasPendingMicroTask = true;
      queueMicrotask(() => {
        this.hasPendingMicroTask = false;
        const pendingObservers = this.pendingObservers;
        this.pendingObservers = [];
        pendingObservers.forEach((pendingObserver) => pendingObserver());
        this.flushLifecycle();
      });
    }
  }
  flushLifecycle() {
    this.lifecycleQueue.toUnmount.forEach((cb) => cb());
    this.lifecycleQueue.toUnmount = [];
    this.lifecycleQueue.toMount.forEach((cb) => cb());
    this.lifecycleQueue.toMount = [];
  }

  pushComponent(instance: ComponentInstance) {
    this.componentStack.unshift(instance);
  }

  popComponent() {
    this.componentStack.shift();
  }

  setAsCurrent() {
    currentRoot = this;
  }

  clearCurrent() {
    if (currentRoot === this) {
      currentRoot = undefined;
    }
  }

  mount(): Node | Node[] {
    // Optimized: avoid intermediate arrays from map+flat
    const childResults: (Node | Node[])[] = [];
    for (let i = 0; i < this.children.length; i++) {
      childResults.push(this.children[i].mount(this));
    }
    const result = flattenNodes(childResults);
    return result.length === 1 ? result[0] : result;
  }
  patch(): void {}
  rerender(operations?: PatchOperation[]): void {
    if (operations) {
      this.applyPatchOperations(this.getHTMLElement(), operations);
    } else {
      this.syncDOMChildren();
    }
    this.flushLifecycle();
  }

  unmount(): void {}
}
