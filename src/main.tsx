import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { content } from "./content";
import "./styles.css";

document.title = content.site.tabTitle;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
