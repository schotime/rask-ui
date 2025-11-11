import { ComponentVNode } from "./ComponentVNode";
import { ElementVNode } from "./ElementVNode";
import { FragmentVNode } from "./FragmentVNode";
import { RootVNode } from "./RootVNode";
import { TextVNode } from "./TextVNode";

export type VNode =
  | ElementVNode
  | FragmentVNode
  | ComponentVNode
  | TextVNode
  | RootVNode;

export type Props = Record<string, unknown>;

/**
 * Bit flags to optimize VNode property checks.
 * Pre-computed during VNode creation to avoid repeated conditional checks.
 */
export const enum VFlags {
  None = 0,
  HasProps = 1 << 0,       // Has any props at all
  HasClass = 1 << 1,       // Has class or className prop
  HasStyle = 1 << 2,       // Has style prop
  HasEvents = 1 << 3,      // Has event listeners (onXxx props)
  HasDataAttrs = 1 << 4,   // Has data-* or aria-* attributes
}
