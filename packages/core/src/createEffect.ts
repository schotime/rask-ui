import { getCurrentComponent, createCleanup } from "./component";
import { Observer } from "./observation";

export function createEffect(cb: () => void) {
  let currentComponent;
  try {
    currentComponent = getCurrentComponent();
  } catch {
    currentComponent = undefined;
  }
  const observer = new Observer(() => {
    // We trigger effects on micro task as synchronous observer notifications
    // (Like when components sets props) should not synchronously trigger effects
    queueMicrotask(runEffect);
  });
  const runEffect = () => {
    const stopObserving = observer.observe();
    cb();

    stopObserving();
  };

  if (currentComponent) {
    createCleanup(() => observer.dispose());
  }

  runEffect();
}
