export function createRef<T>() {
  function ref(node: T | null) {
    ref.current = node;
  }

  ref.current = null as null | T;

  return ref;
}
