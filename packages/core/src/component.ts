import {
  createComponentVNode,
  VNode,
  Component,
  Props,
  InfernoNode,
} from "inferno";
import { VNodeFlags } from "inferno-vnode-flags";
import { getCurrentObserver, Observer, Signal } from "./observation";
import { syncBatch } from "./batch";

export type RaskStatelessFunctionComponent<P extends Props<any>> =
  | (() => VNode)
  | ((props: P) => VNode);

export class RaskStatelessComponent extends Component {
  declare renderFn: RaskStatelessFunctionComponent<any>;
  observer = new Observer(() => {
    this.forceUpdate();
  });
  shouldComponentUpdate(nextProps: Props<any>): boolean {
    for (const prop in nextProps) {
      // @ts-ignore
      if (this.props[prop] !== nextProps[prop]) {
        return true;
      }
    }

    return false;
  }
  render() {
    const stopObserving = this.observer.observe();
    const result = this.renderFn(this.props);
    stopObserving();
    return result;
  }
}

let currentComponent: RaskStatefulComponent<any> | undefined;

export function getCurrentComponent() {
  if (!currentComponent) {
    throw new Error("No current component");
  }

  return currentComponent;
}

export function createMountEffect(cb: () => void) {
  if (!currentComponent) {
    throw new Error("Only use createMountEffect in component setup");
  }

  currentComponent.onMounts.push(cb);
}

export function createCleanup(cb: () => void) {
  if (!currentComponent) {
    throw new Error("Only use createCleanup in component setup");
  }

  currentComponent.onCleanups.push(cb);
}

export type RaskStatefulFunctionComponent<P extends Props<any>> =
  | (() => () => VNode)
  | ((props: P) => () => VNode);

export class RaskStatefulComponent<P extends Props<any>> extends Component<P> {
  declare setup: RaskStatefulFunctionComponent<P>;
  private renderFn?: () => VNode;
  private reactiveProps?: Props<any>;
  private observer = new Observer(() => {
    this.forceUpdate();
  });
  private isRendering = false;
  effects: Array<{ isDirty: boolean; run: () => void }> = [];
  contexts = new Map();
  getChildContext() {
    const parentGetContext = this.context.getContext;

    return {
      ...this.context,
      getContext: (context: any) => {
        return this.contexts.get(context) || parentGetContext(context);
      },
    };
  }
  onMounts: Array<() => void> = [];
  onCleanups: Array<() => void> = [];
  private createReactiveProps() {
    const reactiveProps = {} as any;
    const self = this;
    const signals = new Map<string, Signal>();

    for (const prop in this.props) {
      const value = (this.props as any)[prop];

      // Skip known non-reactive props
      if (
        typeof value === "function" ||
        prop === "children" ||
        prop === "key" ||
        prop === "ref"
      ) {
        reactiveProps[prop] = value;
        continue;
      }

      // Skip objects/arrays - they're already reactive if they're proxies
      // No need to wrap them in additional signals
      if (typeof value === "object" && value !== null) {
        reactiveProps[prop] = value;
        continue;
      }

      // Only create reactive getters for primitives
      Object.defineProperty(reactiveProps, prop, {
        get() {
          if (!self.isRendering) {
            const observer = getCurrentObserver();

            if (observer) {
              // Lazy create signal only when accessed in reactive context
              let signal = signals.get(prop);
              if (!signal) {
                signal = new Signal();
                signals.set(prop, signal);
              }
              observer.subscribeSignal(signal);
            }
          }

          // @ts-ignore
          return self.props[prop];
        },
        set(value) {
          // Only notify if signal was created (i.e., prop was accessed reactively)
          const signal = signals.get(prop);
          if (signal && (self.props as any)[prop] !== value) {
            signal.notify();
          }
        },
      });
    }

    return reactiveProps;
  }

  componentDidMount(): void {
    this.onMounts.forEach((cb) => cb());
  }
  componentWillUnmount(): void {
    this.onCleanups.forEach((cb) => cb());
  }
  /**
   *
   */
  componentWillUpdate(nextProps: any) {
    syncBatch(() => {
      for (const prop in nextProps) {
        if (prop === "children") {
          continue;
        }

        // @ts-ignore
        this.reactiveProps[prop] = nextProps[prop];
      }
    });
  }
  componentWillReceiveProps(): void {}
  shouldComponentUpdate(nextProps: Props<any>): boolean {
    // Shallow comparison of props, excluding internal props
    for (const prop in nextProps) {
      // @ts-ignore
      if (this.props[prop] !== nextProps[prop]) {
        return true;
      }
    }

    return false;
  }
  render() {
    if (!this.renderFn) {
      this.reactiveProps = this.createReactiveProps();
      currentComponent = this;
      try {
        this.renderFn = this.setup(this.reactiveProps as any);

        if (typeof this.renderFn !== "function") {
          throw new Error("Component must return a render function");
        }
      } catch (error) {
        if (typeof this.context.notifyError !== "function") {
          throw error;
        }

        this.context.notifyError(error);

        return null;
      }
      currentComponent = undefined;
    }

    const stopObserving = this.observer.observe();
    let result: any = null;

    try {
      this.isRendering = true;
      result = this.renderFn();
      this.isRendering = false;
    } catch (error) {
      if (typeof this.context.notifyError !== "function") {
        throw error;
      }

      this.context.notifyError(error);
    } finally {
      stopObserving();
    }

    return result;
  }
}

export function createComponent(props: Props<any>, key?: string) {
  return createComponentVNode(
    VNodeFlags.ComponentClass,
    RaskStatefulComponent,
    props as any,
    key
  );
}
