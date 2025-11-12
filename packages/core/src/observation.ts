const observerStack: Observer[] = [];

export function getCurrentObserver() {
  return observerStack[0];
}

let isBatching = false;
const batchedNotifiers = new Set<() => void>();

export function batch(cb: () => void) {
  isBatching = true;
  cb();
  isBatching = false;
  const notifiers = Array.from(batchedNotifiers);
  batchedNotifiers.clear();
  notifiers.forEach((notify) => notify());
}

export class Signal {
  private subscribers = new Set<() => void>();
  subscribe(cb: () => void) {
    this.subscribers.add(cb);

    return () => {
      this.subscribers.delete(cb);
    };
  }
  notify() {
    const currentSubscribers = Array.from(this.subscribers);
    currentSubscribers.forEach((cb) => cb());
  }
}

export class Observer {
  isDisposed = false;
  private signalDisposers = new Set<() => void>();
  private clearSignals() {
    this.signalDisposers.forEach((dispose) => dispose());
    this.signalDisposers.clear();
  }
  private onNotify: () => void;
  constructor(onNotify: () => void) {
    this.onNotify = () => {
      console.log("NOTIFY!!!");
      if (isBatching) {
        batchedNotifiers.add(onNotify);
      } else {
        onNotify();
      }
    };
  }
  subscribeSignal(signal: Signal) {
    this.signalDisposers.add(signal.subscribe(this.onNotify));
  }
  observe() {
    this.clearSignals();
    observerStack.unshift(this);
    return () => {
      observerStack.shift();
    };
  }
  dispose() {
    this.clearSignals();
    this.isDisposed = true;
  }
}
