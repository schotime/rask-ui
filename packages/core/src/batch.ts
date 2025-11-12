const INTERACTIVE_EVENTS = [
  // DISCRETE
  "beforeinput",
  "input",
  "change",
  "compositionend",
  "keydown",
  "keyup",
  "click",
  "contextmenu",
  "submit",
  "reset",

  // GESTURE START
  "pointerdown",
  "mousedown",
  "touchstart",

  // GESTURE END
  "pointerup",
  "mouseup",
  "touchend",
  "touchcancel",
];

export type QueuedCallback = (() => void) & { __queued: boolean };

const asyncQueue: Array<QueuedCallback> = [];
const syncQueue: Array<QueuedCallback> = [];

let inInteractive = 0;
let asyncScheduled = false;
let inSyncBatch = 0;

function scheduleAsyncFlush() {
  if (asyncScheduled) return;
  asyncScheduled = true;
  queueMicrotask(flushAsyncQueue);
}

function flushAsyncQueue() {
  asyncScheduled = false;
  if (!asyncQueue.length) return;

  for (let i = 0; i < asyncQueue.length; i++) {
    const cb = asyncQueue[i];
    asyncQueue[i] = undefined as any;
    cb();
    cb.__queued = false;
  }
  asyncQueue.length = 0;
}

function flushSyncQueue() {
  if (!syncQueue.length) return;

  for (let i = 0; i < syncQueue.length; i++) {
    const cb = syncQueue[i];
    syncQueue[i] = undefined as any;
    cb();
    cb.__queued = false;
  }
  syncQueue.length = 0;
}

export function queue(cb: QueuedCallback) {
  cb.__queued = true;

  if (inSyncBatch) {
    syncQueue.push(cb);
    return;
  }

  asyncQueue.push(cb);
  if (!inInteractive) {
    scheduleAsyncFlush();
  }
}

export function syncBatch(cb: () => void) {
  inSyncBatch++;
  try {
    cb();
    // Only flush on successful completion
    inSyncBatch--;
    if (!inSyncBatch) {
      flushSyncQueue();
    }
  } catch (e) {
    inSyncBatch--;
    throw e; // Re-throw without flushing
  }
}

export function installEventBatching(target: EventTarget = document) {
  const captureOptions: AddEventListenerOptions = {
    capture: true,
    passive: true,
  };
  const bubbleOptions: AddEventListenerOptions = { passive: true };

  const onCapture = () => {
    inInteractive++;
    scheduleAsyncFlush(); // backup in case of stopPropagation
  };

  const onBubble = () => {
    if (--inInteractive === 0 && asyncQueue.length) {
      // Flush inline once outermost interactive event finishes
      flushAsyncQueue();
    }
  };

  INTERACTIVE_EVENTS.forEach((type) => {
    target.addEventListener(type, onCapture, captureOptions);
  });

  queueMicrotask(() => {
    INTERACTIVE_EVENTS.forEach((type) => {
      target.addEventListener(type, onBubble, bubbleOptions);
    });
  });
}
