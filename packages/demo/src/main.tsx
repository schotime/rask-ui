import {
  createContext,
  createState,
  ErrorBoundary,
  onMount,
  render,
} from "rask-ui";

const TestContext = createContext<string>();

function App() {
  const state = createState({ count: 0 });
  TestContext.inject("hihi");
  onMount(() => {
    console.log("MOUNTED");
  });
  return () => (
    <div>
      <h1
        onClick={() => {
          state.count++;
          console.log("HEY", state.count);
        }}
      >
        Hello World {state.count}
      </h1>
      <>haha</>
    </div>
  );
}

render(<App />, document.querySelector("#app"));
