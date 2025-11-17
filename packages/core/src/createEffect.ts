import { getCurrentComponent, createCleanup } from "./component";
import { Observer } from "./observation";

export function createEffect(cb: () => void | (() => void)) {
  let currentComponent;
  try {
    currentComponent = getCurrentComponent();
  } catch {
    currentComponent = undefined;
  }
  let disposer: (() => void) | void;
  const observer = new Observer(() => {
    // We trigger effects on micro task as synchronous observer notifications
    // (Like when components sets props) should not synchronously trigger effects
    queueMicrotask(runEffect);
  });
  const runEffect = () => {
    try {
      disposer?.();
    } catch (error) {
      console.error("Error in effect dispose function:", error);
    }
    const stopObserving = observer.observe();
    disposer = cb();
    stopObserving();
  };

  if (currentComponent) {
    createCleanup(() => observer.dispose());
  }

  runEffect();
}
