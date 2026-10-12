import { useState } from "react";
import { GuiView } from "./components/GuiView";
import { Terminal } from "./components/Terminal";

type Mode = "cli" | "gui";

export default function App() {
  const [mode, setMode] = useState<Mode>("cli"); // not persisted: every load starts in CLI

  const toggle = () => {
    if (mode === "cli") window.scrollTo(0, 0);
    setMode(mode === "cli" ? "gui" : "cli");
  };

  // The views are mounted conditionally, so going back to CLI starts a fresh session.
  return (
    <div className="tp-page">
      <div className={`tp-shell tp-shell--${mode}`}>
        <button type="button" className="tp-toggle" onClick={toggle}>
          {mode === "cli" ? "gui mode" : "cli mode"}
        </button>
        {mode === "cli" ? <Terminal onToggle={toggle} /> : <GuiView />}
      </div>
    </div>
  );
}
