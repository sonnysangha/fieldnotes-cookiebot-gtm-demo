import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { createDemoStore } from "./lib/demo-store";
import "./style.css";

const store = createDemoStore(window, document, window.DEMO_CONFIG);
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App store={store} />
  </StrictMode>,
);
