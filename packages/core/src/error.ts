import { getCurrentComponent } from "./component";

export function ErrorBoundary(props: {
  error: (error: unknown) => ChildNode | ChildNode[];
  children: any;
}) {
  const component = getCurrentComponent();
  // Access .error during setup to ensure the error signal is created
  // This allows child errors to be caught even during initial render
  component.error;

  return () => {
    if (component.error) {
      return props.error(component.error);
    }

    // Fix parent relationship: children vnodes were created with wrong parent,
    // we need to update them to point to this ErrorBoundary component
    const children = Array.isArray(props.children) ? props.children : [props.children];
    children.forEach((child: any) => {
      if (child?.data?.parentComponent) {
        child.data.parentComponent = component;
      }
    });

    return props.children;
  };
}
