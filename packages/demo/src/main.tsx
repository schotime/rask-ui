import { createAsync, render } from "rask-ui";
import { TodoApp } from "./components/TodoApp";
import "./style.css";

function SomethingAsync() {
  const test = createAsync(new Promise((resolve) => setTimeout(resolve, 1000)));

  return () => {
    console.log("Render", test.isPending, test.error, test.value);

    if (test.isPending) {
      return <p>Loading...</p>;
    }

    if (test.error) {
      return <p>Error</p>;
    }

    return <p>Woop di do!</p>;
  };
}

render(<SomethingAsync />, document.querySelector("#app")!);
