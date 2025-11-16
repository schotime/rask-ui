export const INSPECT_MARKER = Symbol("INSPECT");

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
    };

export type InspectorCallback = (event: InspectEvent) => void;

export function inspect(root: any, cb: InspectorCallback) {
  root[INSPECT_MARKER] = {
    fn: cb,
    path: [],
  };
}
