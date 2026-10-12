import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { runCommand, type CommandOutput } from "../commands";
import { content } from "../content";
import { HOME } from "../fs";
import { linkify } from "../lib/linkify";
import { WelcomePanel } from "./WelcomePanel";

type Entry = { id: number; directory: string; command: string; result: CommandOutput };

// `directory` is a folder name, which is also the last path component: "~" at
// home, "about" inside ~/about — what macOS's default zsh prompt shows.
function Prompt({ directory }: { directory: string }) {
  return (
    <>
      <span className="tp-prompt-user">{content.site.promptUser}</span>
      <span className="tp-prompt-tilde">{directory}</span>
      <span className="tp-prompt-symbol">%</span>
    </>
  );
}

function Output({ result }: { result: CommandOutput }) {
  if (typeof result !== "string") return <WelcomePanel />;
  if (result === "") return null;
  return <div className="tp-cli-output">{linkify(result)}</div>;
}

export function Terminal({ onToggle }: { onToggle: () => void }) {
  const [input, setInput] = useState("");
  const [cwd, setCwd] = useState(HOME);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(0);

  useEffect(() => {
    window.scrollTo(0, document.body.scrollHeight);
  }, [entries]);

  const submit = () => {
    const [cmd] = input.trim().split(/\s+/);
    if (cmd === "") return;
    if (cmd === "clear") {
      // History is the entry list, so this wipes up/down recall too.
      setEntries([]);
      setInput("");
      setHistIdx(-1);
      return;
    }
    const result = runCommand(input, cwd);
    setEntries([...entries, { id: nextId.current++, directory: cwd, command: input, result: result.output }]);
    setInput("");
    setHistIdx(-1);
    setCwd(result.cwd);
    if (result.toggleToGui) onToggle();
  };

  const recall = (idx: number) => {
    setHistIdx(idx);
    setInput(idx === -1 ? "" : entries[entries.length - 1 - idx].command);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      submit();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (entries.length > 0) recall(Math.min(histIdx + 1, entries.length - 1));
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histIdx >= 0) recall(histIdx - 1);
    }
  };

  const focusInput = () => {
    // Don't steal a text selection the visitor is making in the output.
    if (window.getSelection()?.toString()) return;
    inputRef.current?.focus();
  };

  return (
    <div className="tp-cli-body" onClick={focusInput}>
      {entries.map((entry) => (
        <div className="tp-cli-entry" key={entry.id}>
          <div className="tp-prompt-line">
            <Prompt directory={entry.directory} />
            <span>{entry.command}</span>
          </div>
          <Output result={entry.result} />
        </div>
      ))}
      <div className="tp-prompt-line">
        <Prompt directory={cwd} />
        <input
          ref={inputRef}
          className="tp-cli-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          spellCheck={false}
          autoFocus
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          aria-label="terminal input"
        />
      </div>
    </div>
  );
}
