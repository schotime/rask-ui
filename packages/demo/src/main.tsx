import { render } from "rask-ui";

import "./style.css";
import { TodoApp } from "./components/TodoApp";

render(<TodoApp />, document.querySelector("#app")!);
