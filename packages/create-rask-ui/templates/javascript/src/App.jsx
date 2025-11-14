import { component, signal } from "rask-ui";

export const App = component(() => {
  const count = signal(0);

  return () => (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Welcome to Rask UI!</h1>
      <p>
        A fast, reactive UI library built on Inferno with a powerful component
        model.
      </p>

      <div style={{ marginTop: "2rem" }}>
        <button
          onClick={() => count.value++}
          style={{
            padding: "0.5rem 1rem",
            fontSize: "1rem",
            cursor: "pointer",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Count: {count}
        </button>
      </div>

      <div style={{ marginTop: "2rem", color: "#666" }}>
        <p>
          Edit <code>src/App.jsx</code> and save to test hot module
          replacement.
        </p>
      </div>
    </div>
  );
});
