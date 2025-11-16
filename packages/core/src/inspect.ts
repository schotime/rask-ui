export const INSPECT_MARKER = Symbol("INSPECT");

// Flag to check if inspector is enabled (only in development)
export const INSPECTOR_ENABLED = import.meta.env.DEV;

export type InspectEvent =
  | {
      type: "mutation";
      path: string[];
      value: any;
    }
  | {
      type: "action";
      path: string[];
      params: any[];
    }
  | {
      type: "computed";
      path: string[];
      isDirty: boolean;
      value: any;
    };

export type InspectorCallback = (event: InspectEvent) => void;

export type InspectorRef = {
  current?: { notify: InspectorCallback; path: string[] };
};

export function inspect(root: any, cb: InspectorCallback) {
  if (!INSPECTOR_ENABLED) {
    return;
  }

  root[INSPECT_MARKER] = {
    current: {
      notify: cb,
      path: [],
    },
  };
}
