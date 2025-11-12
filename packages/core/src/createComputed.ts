import { getCurrentComponent, onCleanup } from "./component";
import { getCurrentObserver, Observer, Signal } from "./observation";

export function createComputed<T extends Record<string, () => any>>(
  computed: T
): {
  [K in keyof T]: ReturnType<T[K]>;
} {
  let currentComponent;
  try {
    currentComponent = getCurrentComponent();
  } catch {
    currentComponent = undefined;
  }
  const proxy = {};

  for (const prop in computed) {
    let isDirty = true;
    let value: any;
    const signal = new Signal();
    const computedObserver = new Observer(() => {
      isDirty = true;
      signal.notify();
    });

    if (currentComponent) {
      onCleanup(() => computedObserver.dispose());
    }

    Object.defineProperty(proxy, prop, {
      get() {
        const currentObserver = getCurrentObserver();

        if (currentObserver) {
          currentObserver.subscribeSignal(signal);
        }

        if (isDirty) {
          const stopObserving = computedObserver.observe();
          value = computed[prop]();
          stopObserving();
          isDirty = false;
          return value;
        }

        return value;
      },
    });
  }

  return proxy as any;
}
