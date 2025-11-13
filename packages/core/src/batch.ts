export type QueuedCallback = (() => void) & { __queued: boolean };

const asyncQueue: Array<QueuedCallback> = [];
const syncQueue: Array<QueuedCallback> = [];

let inInteractive = 0;
let asyncScheduled = false;
let inSyncBatch = 0;

// New: guards against re-entrant flushing
let inAsyncFlush = false;
let inSyncFlush = false;

function scheduleAsyncFlush() {
  if (asyncScheduled) return;
  asyncScheduled = true;
  queueMicrotask(flushAsyncQueue);
}

function flushAsyncQueue() {
  if (inAsyncFlush) return;
  inAsyncFlush = true;
  asyncScheduled = false;

  try {
    if (!asyncQueue.length) return;

    // Note: we intentionally DO NOT snapshot.
    // If callbacks queue more async work, it gets picked up
    // in this same loop because length grows.
    for (let i = 0; i < asyncQueue.length; i++) {
      const cb = asyncQueue[i];
      asyncQueue[i] = undefined as any;
      cb();
      cb.__queued = false;
    }
    asyncQueue.length = 0;
  } finally {
    inAsyncFlush = false;
  }
}

function flushSyncQueue() {
  if (inSyncFlush) return;
  inSyncFlush = true;

  try {
    if (!syncQueue.length) return;

    // Same pattern as async: no snapshot, just iterate.
    // New callbacks queued via syncBatch inside this flush
    // will be pushed to syncQueue and picked up by this loop.
    for (let i = 0; i < syncQueue.length; i++) {
      const cb = syncQueue[i];
      syncQueue[i] = undefined as any;
      cb();
      cb.__queued = false;
    }
    syncQueue.length = 0;
  } finally {
    inSyncFlush = false;
  }
}

export function queue(cb: QueuedCallback) {
  // Optional: uncomment this if you want deduping:
  // if (cb.__queued) return;

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
  } catch (e) {
    inSyncBatch--;
    throw e; // no flush on error
  }

  inSyncBatch--;
  if (!inSyncBatch) {
    // Only the outermost syncBatch triggers a flush.
    // If this happens *inside* an ongoing flushSyncQueue,
    // inSyncFlush will be true and flushSyncQueue will no-op.
    flushSyncQueue();
  }
}
