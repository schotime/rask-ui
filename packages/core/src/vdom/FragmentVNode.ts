import { AbstractVNode, PatchOperation } from "./AbstractVNode";
import { ComponentVNode } from "./ComponentVNode";
import { ElementVNode } from "./ElementVNode";
import { RootVNode } from "./RootVNode";
import { TextVNode } from "./TextVNode";
import { VNode } from "./types";
import { flattenNodes } from "./dom-utils";

export const Fragment = Symbol("Fragment");

export class FragmentVNode extends AbstractVNode {
  children: VNode[];
  key?: string;

  constructor(children: VNode[], key?: string) {
    super();
    this.children = children;
    this.key = key;
  }
  mount(parent?: VNode): Node[] {
    this.parent = parent;

    if (parent instanceof RootVNode) {
      this.root = parent;
    } else {
      this.root = parent?.root;
    }

    // Optimized: avoid intermediate arrays from map+flat
    const childResults: (Node | Node[])[] = [];
    for (let i = 0; i < this.children.length; i++) {
      childResults.push(this.children[i].mount(this));
    }
    return flattenNodes(childResults);
  }
  rerender(operations?: PatchOperation[]): void {
    this.parent?.rerender(operations);
  }
  patch(newNode: FragmentVNode) {
    const { children, hasChangedStructure, operations } = this.patchChildren(
      newNode.children
    );
    this.children = children;

    // So we can safely pass remove/replace operations up to the parent, but add
    // is very tricky as parent has potentially other children as well. This can be
    // handled with some additional detection, changing it to insertBefore. This can be
    // done by passing this vnode up to the parent
    this.rerender(
      hasChangedStructure ||
        operations.some((operation) => operation.type === "add")
        ? undefined
        : operations
    );
  }
  unmount() {
    this.children.forEach((child) => child.unmount());
    this.root?.queueUnmount(() => {
      delete this.parent;
    });
  }
}
