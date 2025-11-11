import { AbstractVNode, PatchOperation } from "./AbstractVNode";
import { RootVNode } from "./RootVNode";

import { Props, VNode, VFlags } from "./types";
import {
  isEventProp,
  setElementAttr,
  setElementProp,
  setElementStyle,
  setElementClass,
} from "./dom-utils";
import { diffObjectKeys } from "./utils";

export class ElementVNode extends AbstractVNode {
  tag: string;
  props: Props;
  children: VNode[];
  key?: string;
  flags: VFlags;
  private ref?: <U extends HTMLElement>(node: U) => (() => void) | void;
  private eventListeners?: Record<string, () => void>;
  constructor(
    tag: string,
    { ref, ...props }: Props,
    children: VNode[],
    key?: string
  ) {
    super();
    this.tag = tag;
    this.props = props;
    this.children = children;
    this.key = key;
    this.ref = ref as any;

    // Pre-compute flags for fast-path checks during patching
    this.flags = this.computeFlags(props);
  }

  private computeFlags(props: Props): VFlags {
    let flags = VFlags.None;

    const propKeys = Object.keys(props);
    if (propKeys.length > 0) {
      flags |= VFlags.HasProps;

      for (let i = 0; i < propKeys.length; i++) {
        const key = propKeys[i];

        if (key === "class" || key === "className") {
          flags |= VFlags.HasClass;
        } else if (key === "style") {
          flags |= VFlags.HasStyle;
        } else if (isEventProp(key)) {
          flags |= VFlags.HasEvents;
        } else if (key.startsWith("data-") || key.startsWith("aria-")) {
          flags |= VFlags.HasDataAttrs;
        }
      }
    }

    return flags;
  }
  rerender(operations?: PatchOperation[]): void {
    if (operations) {
      this.applyPatchOperations(this.getHTMLElement(), operations);
    } else {
      this.syncDOMChildren();
    }
  }
  mount(parent?: VNode): Node {
    this.parent = parent;

    if (parent instanceof RootVNode) {
      this.root = parent;
    } else {
      this.root = parent?.root;
    }

    const elm = (this.elm = document.createElement(this.tag));

    for (const prop in this.props) {
      this.setProp(prop, this.props[prop]);
    }

    if (this.ref) {
      const ref = this.ref;
      this.root?.queueMount(() => {
        ref(elm);
      });
    }

    this.children.forEach((child) => {
      const childrenElms = child.mount(this);

      if (Array.isArray(childrenElms)) {
        childrenElms.forEach((node) => this.elm!.appendChild(node));
      } else {
        elm.appendChild(childrenElms);
      }
    });

    return elm;
  }
  /**
   * An ELEMENT patch goes through three operations
   * - Patch or replace the element
   * - Patch the children
   */
  patch(newNode: ElementVNode) {
    // Save old flags before updating
    const oldFlags = this.flags;

    // Only patch props if either old or new node has props
    if ((oldFlags | newNode.flags) & VFlags.HasProps) {
      this.patchProps(newNode.props, oldFlags, newNode.flags);
    }

    // Update flags and props after patching
    this.flags = newNode.flags;
    this.props = newNode.props;

    const { children, hasChangedStructure, operations } = this.patchChildren(
      newNode.children
    );
    this.children = children;

    if (hasChangedStructure) {
      this.syncDOMChildren();
    } else {
      this.applyPatchOperations(this.getHTMLElement(), operations);
    }
  }
  unmount() {
    this.children.forEach((child) => child.unmount());
    this.root?.queueUnmount(() => {
      if (this.eventListeners) {
        for (const type in this.eventListeners) {
          this.elm!.removeEventListener(type, this.eventListeners[type]);
        }
      }
      delete this.elm;
      delete this.parent;
    });
  }
  private setProp = (prop: string, value: any) => {
    const elm = this.getHTMLElement();

    if (prop === "children") {
      return;
    }

    if (prop === "class") {
      setElementClass(elm, value as string | Record<string, boolean>);
      return;
    }

    // Skip className if class is present (class takes precedence)
    if (prop === "className" && "class" in this.props) {
      return;
    }

    if (prop === "style") {
      setElementStyle(elm, value);
      return;
    }

    if (prop.startsWith("data-") || prop.startsWith("aria-")) {
      setElementAttr(elm, prop, value as string);
      return;
    }

    if (isEventProp(prop)) {
      this.addEventListener(
        prop.slice(2).toLowerCase(),
        value as (() => void) | null
      );
      return;
    }

    setElementProp(elm, prop, value);
  };
  private patchProps(newProps: Props, oldFlags: VFlags, newFlags: VFlags) {
    // Early bailout for reference equality
    if (this.props === newProps) {
      return;
    }

    const oldProps = this.props;
    const elm = this.getHTMLElement();

    // Handle class separately for efficiency (check if either old or new has class)
    if ((oldFlags | newFlags) & VFlags.HasClass) {
      const oldClass = oldProps.class ?? oldProps.className;
      const newClass = newProps.class ?? newProps.className;
      if (oldClass !== newClass) {
        setElementClass(elm, newClass as string | Record<string, boolean>);
      }
    }

    // Handle style separately with per-property diffing (check if either old or new has style)
    if ((oldFlags | newFlags) & VFlags.HasStyle) {
      this.patchStyle(oldProps.style, newProps.style);
    }

    // Handle regular props (excluding class, className, style, children)
    diffObjectKeys(oldProps, newProps, (key, value, oldValue) => {
      // Skip props we've already handled
      if (
        key === "class" ||
        key === "className" ||
        key === "style" ||
        key === "children"
      ) {
        return;
      }
      this.setProp(key, value);
    });
  }

  private patchStyle(
    oldStyle: string | Record<string, unknown> | null | undefined,
    newStyle: string | Record<string, unknown> | null | undefined
  ) {
    // Early bailout for reference equality
    if (oldStyle === newStyle) {
      return;
    }

    const elm = this.getHTMLElement();

    // If either is a string, fall back to full replacement
    if (typeof oldStyle === "string" || typeof newStyle === "string") {
      setElementStyle(elm, newStyle);
      return;
    }

    // Per-property style diffing for objects
    const os = oldStyle || {};
    const ns = (newStyle as Record<string, unknown>) || {};

    // Remove old styles not in new
    for (const key in os) {
      if (!(key in ns)) {
        elm.style[key as any] = "";
      }
    }

    // Set new/changed styles
    for (const key in ns) {
      const newVal = ns[key];
      if (newVal !== (os as Record<string, unknown>)[key]) {
        elm.style[key as any] = newVal as string;
      }
    }
  }
  private addEventListener(type: string, cb: (() => void) | null) {
    if (!this.eventListeners) {
      this.eventListeners = {};
    }

    if (this.eventListeners[type]) {
      this.elm!.removeEventListener(type, this.eventListeners[type]);
    }

    if (typeof cb === "function") {
      this.elm!.addEventListener(type, cb);
      this.eventListeners[type] = cb;
    } else {
      delete this.eventListeners[type];
    }
  }
}
