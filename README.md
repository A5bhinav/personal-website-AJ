# Terminal Portfolio — Build Spec

> **For the agent building this.** This document fully specifies a single-page personal portfolio that opens as a fake macOS-style zsh terminal (CLI mode) and can switch to a minimal, text-only résumé page (GUI mode). Build everything described here. **Do not invent biographical content.** All personal content lives in one file, `src/content.ts`, which you create with obvious placeholder values (`TODO_…`); the owner will fill it in later. Every piece of UI and every virtual file must be *derived* from that file, so editing content never requires touching components.
>
> Sections 1–11 are required. Section 12 lists optional enhancements — only build those if the owner asks.

---

## 1. What it is

- **One page, no routing, no backend.** Pure client-side React app, static build, deployable to Vercel.
- **Two modes**, toggled by a small text button in the top-right of the content column:
  - **CLI mode (default on load):** a blinking-caret prompt like `guest@josh ~ %`. Visitors type shell commands (`ls`, `cd`, `cat`, `tree`, `pwd`, `clear`, `help`, `toggle`) to browse a tiny virtual filesystem containing the owner's info as `.txt` files.
  - **GUI mode:** the same info as a plain, monospace, single-column résumé page (name, links, intro, then EXPERIENCE / PROJECTS / RESEARCH / COURSEWORK lists, footer).
- **Aesthetic:** near-black background, light-grey monospace text at 12px, a single warm tan accent (`#dba876`) used for command output, section titles and rules. Narrow centered column (max 46rem). No images, no icons, no web fonts, no animation beyond the native input caret.

---

## 2. Tech stack

| Thing | Choice |
|---|---|
| Build | Vite |
| UI | React 18 + TypeScript |
| Styling | One plain CSS file (`src/styles.css`) using `tp-` prefixed classes. No Tailwind needed. |
| Tests | Vitest (for the pure command logic) |
| Hosting | Vercel (static) |

Fonts: system monospace stack only — `"SF Mono", Consolas, Monaco, "Courier New", monospace`. Do not load a web font.

---

## 3. File structure

```
index.html
src/
  main.tsx                 # createRoot, import styles.css, render <App/>
  App.tsx                  # mode state ("cli" | "gui"), page shell, toggle button
  content.ts               # ALL personal content + site config (placeholders)
  fs.ts                    # builds the virtual tree + file contents from content.ts; path helpers
  commands.ts              # pure: runCommand(input, cwd) -> CommandResult
  lib/linkify.tsx          # turns URLs/emails inside output strings into <a> tags
  components/
    Terminal.tsx           # CLI mode
    WelcomePanel.tsx       # boxed help screen shown by `help`
    PixelSprite.tsx        # tiny pixel-art mascot used in the panel
    GuiView.tsx            # GUI mode
  styles.css
  __tests__/commands.test.ts
```

Keep `fs.ts` and `commands.ts` free of React so they can be unit-tested. `commands.ts` may return a sentinel for the welcome panel (see §7) that `Terminal.tsx` turns into `<WelcomePanel/>`.

---

## 4. Content model (`src/content.ts`)

Create this file with the types below and placeholder values. Arrays should contain 2–3 placeholder items each so layouts can be checked.

```ts
export type Experience = { title: string; company: string };
export type Project    = { name: string; description?: string; url?: string; tech?: string[] }; // only `name` is used in the core build
export type Research   = { title: string; role: string };
export type Course     = { code: string; name: string; grade: string }; // grade may be "in progress"
export type ContactRow = { label: string; value: string };              // value may be an email or URL
export type NavLink    = { label: string; href: string };

export const content = {
  site: {
    tabTitle: "TODO_TAB_TITLE",          // <title> of the page
    fullName: "TODO_FULL_NAME",          // GUI heading + footer
    firstName: "TODO_FIRST_NAME",        // "Welcome to {firstName}'s terminal!"
    promptUser: "guest@TODO_HANDLE",     // left part of every prompt line
  },
  welcome: {
    title: "TODO_PANEL_TITLE",           // e.g. "josh.sh" — boxed panel title
    version: "v0.1.0",                   // shown muted after the title
    metaLine: "zsh · guest session",     // first line of the bottom-left meta
    cwdLabel: "~/TODO_HANDLE",           // second line of the meta (indented)
    commandNames: ["help"],              // commands that open the panel
  },
  guiLinks: [                            // row under the name in GUI mode
    { label: "GitHub",   href: "https://github.com/TODO" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/TODO/" },
    { label: "Email",    href: "mailto:TODO@example.com" },
  ] as NavLink[],
  intro: {
    paragraphs: [                        // first paragraph is a greeting, e.g. "Hey, I'm X."
      "TODO_INTRO_GREETING",
      "TODO_INTRO_PARAGRAPH_2",
      "TODO_INTRO_PARAGRAPH_3",
    ],
    cliParagraphs: undefined as string[] | undefined, // optional different wording for intro.txt; falls back to paragraphs
  },
  education: {
    school: "TODO_SCHOOL",
    degree: "TODO_DEGREE",
    gpaLabel: "GPA",                     // e.g. "Technical GPA"
    gpa: "TODO_GPA" as string | undefined, // omit line if undefined
  },
  experience: [] as Experience[],
  projects:   [] as Project[],
  research:   [] as Research[],
  coursework: [] as Course[],
  contact: [                             // contact.txt rows, in order
    { label: "Email",    value: "TODO@example.com" },
    { label: "LinkedIn", value: "https://www.linkedin.com/in/TODO/" },
    { label: "GitHub",   value: "https://github.com/TODO" },
  ] as ContactRow[],
};
```

**Empty sections:** if `research` (or `experience`, `projects`, `coursework`) is an empty array, omit that GUI section *and* its virtual file. If a folder ends up with no children, omit the folder too.

---

## 5. Virtual filesystem (`src/fs.ts`)

### 5.1 Tree shape

A flat map from **folder name → node**. `"~"` is home. Order of `children` is display order.

```ts
type Node = { parent: string | null; children: string[] };
// default tree
{
  "~":        { parent: null, children: ["about", "experience", "projects.txt", "contact.txt"] },
  about:      { parent: "~",  children: ["intro.txt", "education.txt"] },
  experience: { parent: "~",  children: ["work.txt", "research.txt"] },
}
```

Rules (document them in a comment in `fs.ts`):
- A name containing `.` is a **file**; a name with no `.` is a **folder** and must be a key in the tree.
- Folder names are unique across the whole tree; file names are unique across the whole tree (file contents are stored in a flat `files: Record<string, string>` keyed by file name).
- Helper `pathOf(folder)`: walk `parent` links to build `"~"`, `"~/about"`, `"~/a/b"`, …

### 5.2 File contents (exact formats)

All files are plain strings. Build them from `content.ts`:

| File | Format |
|---|---|
| `intro.txt` | `(cliParagraphs ?? paragraphs).join("\n\n")` |
| `education.txt` | see below |
| `work.txt` | one line per item: `` `${title} @ ${company}` `` joined with `"\n"` |
| `research.txt` | per item: `` `${title}\n  ${role}` `` (role indented 2 spaces), items joined with `"\n\n"` |
| `projects.txt` | `` `[${i + 1}] ${name}` `` joined with `"\n"` |
| `contact.txt` | per row: `` `${(label + ":").padEnd(W)}${value}` `` where `W = max(label.length + 1) + 1`, joined with `"\n"` — so values line up in one column |

`education.txt`:

```
{school} -- {degree}
{gpaLabel}: {gpa}            <- omit this line if gpa is undefined

Coursework:
  {code padded to longest code} -- {name padded to longest name}   {grade}
  ...
```

i.e. each course line is `` `  ${code.padEnd(maxCode)} -- ${name.padEnd(maxName)}   ${grade}` `` (2-space indent, ` -- ` separator, 3 spaces before grade). Omit the blank line + `Coursework:` block if there are no courses.

Example `contact.txt` rendering:

```
Email:    someone@example.com
LinkedIn: https://www.linkedin.com/in/someone/
GitHub:   https://github.com/someone
```

---

## 6. Design tokens and stylesheet (`src/styles.css`)

Use these exact values. This is the complete stylesheet for the core build.

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: #0a0a0a; }

:root {
  --tp-bg: #0a0a0a;          /* page */
  --tp-fg: #c4c4c4;          /* body text, typed commands */
  --tp-fg-bright: #f2f2f2;   /* prompt user, name, highlighted commands */
  --tp-muted: #6b6b6b;       /* "%", toggle, bullets, meta, footer */
  --tp-accent: #dba876;      /* command output, section titles, panel border */
  --tp-blue: #6ab0f3;        /* directory in prompt */
  --tp-link: #d0d0d0;        /* links */
  --tp-rule: #2a2a2a;        /* thin dividers */
  --tp-error: #e06c75;       /* defined but unused in core (errors use accent like all output) */
}

/* page + column */
.tp-page { min-height: 100vh; background: var(--tp-bg); color: var(--tp-fg);
  font-family: "SF Mono", Consolas, Monaco, "Courier New", monospace; font-size: 12px; line-height: 1.2; }
.tp-shell { position: relative; max-width: 46rem; margin: 0 auto; padding-left: 1.5rem; padding-right: 1.5rem; }
.tp-shell--cli { min-height: 100vh; padding-top: 9rem; padding-bottom: 2rem; display: flex; flex-direction: column; }
.tp-shell--gui { padding-top: 9rem; padding-bottom: 5rem; }

/* mode toggle */
.tp-toggle { position: absolute; top: 8.9rem; right: 1.5rem; background: none; border: none; padding: 0;
  color: var(--tp-muted); font-family: inherit; font-size: 12px; cursor: pointer; z-index: 10; }
.tp-toggle:hover { color: var(--tp-fg); }

/* CLI */
.tp-cli-body { flex: 1; cursor: text; }
.tp-cli-entry { margin-bottom: .75rem; }
.tp-prompt-line { display: flex; align-items: center; gap: .5rem; }
.tp-prompt-user { color: var(--tp-fg-bright); }
.tp-prompt-tilde { color: var(--tp-blue); }
.tp-prompt-symbol { color: var(--tp-muted); }
.tp-cli-output { color: var(--tp-accent); line-height: 1.45; white-space: pre-wrap; }
.tp-cli-input { flex: 1; background: transparent; border: none; outline: none; color: var(--tp-fg);
  caret-color: var(--tp-fg); font: inherit; }

/* welcome panel */
.tp-claude { position: relative; display: flex; border: 1px solid var(--tp-accent); border-radius: 6px; margin: .9rem 0 .4rem; }
.tp-claude-title { position: absolute; top: -.5rem; left: 1rem; padding: 0 .4rem; background: var(--tp-bg);
  color: var(--tp-accent); font-weight: 700; }
.tp-claude-left { flex: 0 0 38%; display: flex; flex-direction: column; align-items: center; gap: 1rem;
  padding: 1.4rem 1rem 1.1rem; border-right: 1px solid var(--tp-accent); }
.tp-claude-welcome { color: var(--tp-fg-bright); font-weight: 700; }
.tp-claude-mascot { display: grid; grid-template-columns: repeat(12, 7px); margin-top: 2.8rem; }
.tp-px { width: 7px; height: 7px; }
.tp-px--on { background: var(--tp-accent); }
.tp-claude-meta { align-self: flex-start; margin-top: auto; color: var(--tp-muted); line-height: 1.5; }
.tp-claude-cwd { padding-left: 1.2rem; }
.tp-claude-right { flex: 1; min-width: 0; padding: 1.1rem 1.1rem 1rem; }
.tp-claude-heading { color: var(--tp-accent); font-weight: 700; margin-bottom: .4rem; }
.tp-claude-row { color: var(--tp-fg); line-height: 1.5; }
.tp-claude-cmd { color: var(--tp-fg-bright); }
.tp-claude-sep { border-top: 1px solid var(--tp-rule); margin: .9rem 0; }
.tp-claude-note { margin-top: .6rem; color: var(--tp-muted); font-style: italic; }

/* GUI */
.tp-name { color: var(--tp-fg-bright); font-size: 1.15rem; font-weight: 700; margin-bottom: .5rem; }
.tp-links { display: flex; flex-wrap: wrap; gap: 0 1.25rem; font-size: 12px; margin-bottom: .5rem; }
.tp-links + .tp-hr { margin-top: 0; }
.tp-links a.tp-link { color: var(--tp-muted); text-decoration: none; }
.tp-links a.tp-link:hover { color: var(--tp-fg-bright); text-decoration: underline; }
.tp-hr { border: none; border-top: 1px solid var(--tp-rule); margin: 1.75rem 0; }
.tp-hr--accent { border-top-color: var(--tp-accent); }
.tp-intro p { margin-bottom: 1.1rem; font-size: 12px; line-height: 1.2; }
.tp-section { margin-bottom: 2.25rem; }
.tp-section-title { color: var(--tp-accent); font-weight: 700; letter-spacing: .04em; font-size: 12px; margin-bottom: 1rem; }
.tp-list { list-style: none; font-size: 12px; }
.tp-list li { position: relative; padding-left: 1.1rem; margin-bottom: .35rem; }
.tp-list li::before { content: "•"; position: absolute; left: 0; color: var(--tp-muted); }
a.tp-link { color: var(--tp-link); text-decoration: underline; text-underline-offset: 2px; }
a.tp-link:hover { color: var(--tp-fg-bright); }
.tp-muted { color: var(--tp-muted); }
.tp-footer { margin-top: 3rem; font-size: 12px; color: var(--tp-muted); }

/* mobile */
@media (max-width: 640px) {
  .tp-shell--gui, .tp-shell--cli { padding-top: 6rem; }
  .tp-toggle { top: 5.9rem; right: 1.25rem; }
  .tp-claude { flex-direction: column; }
  .tp-claude-left { flex: none; border-right: none; border-bottom: 1px solid var(--tp-accent); }
  .tp-claude-meta { margin-top: 0; }
}
```

`index.html`: `<title>` from `content.site.tabTitle` (set via `document.title` in `main.tsx`, or hardcode after content is filled), `<meta name="viewport" content="width=device-width, initial-scale=1.0">`, and `<body style="background:#0a0a0a">` to prevent a white flash before React mounts.

---

## 7. CLI mode (`Terminal.tsx`)

### 7.1 Layout

```
.tp-page
  .tp-shell.tp-shell--cli
    button.tp-toggle  "gui mode"
    .tp-cli-body                    (fills remaining height; clicking anywhere focuses the input)
      .tp-cli-entry  × N            (past commands)
        .tp-prompt-line  [user] [dir] [%] [command text]
        output (string -> .tp-cli-output, panel -> <WelcomePanel/>, "" -> nothing)
      .tp-prompt-line               (live prompt)
        [user] [dir] [%] <input.tp-cli-input>
```

Prompt pieces are separate spans: `promptUser` (`.tp-prompt-user`), directory label (`.tp-prompt-tilde`), `%` (`.tp-prompt-symbol`), then the command text (default color). Spacing comes from the flex `gap: .5rem` — no literal spaces.

**Directory label** = the *last path component*, like macOS's default zsh prompt: `~` at home, `about` inside `~/about`. Each past entry shows the directory it was run *from* (captured before the command executes, so `cd about` shows `~`).

### 7.2 Initial state

Empty history, cwd `~`, a single live prompt line at the top of the column with the input **auto-focused**. Nothing else on screen except the `gui mode` toggle. (The welcome panel is *not* shown on load — only via `help`.)

### 7.3 State

```ts
const [input, setInput] = useState("");
const [cwd, setCwd] = useState("~");
const [entries, setEntries] = useState<Entry[]>([]); // { id, directory, command, result }
const [histIdx, setHistIdx] = useState(-1);
```

### 7.4 Keyboard

- **Enter**
  - If `input.trim() === ""` → do nothing (leave the input as is, add no entry).
  - If `input.trim() === "clear"` → `entries = []`, `input = ""`. No entry is added.
  - Otherwise run the command (§8), append `{ id, directory: cwd, command: input, result }`, set `input = ""`, `histIdx = -1`, and apply any cwd change / mode toggle.
- **ArrowUp** (preventDefault): if there are entries, `histIdx = min(histIdx + 1, entries.length - 1)` and `input = entries[entries.length - 1 - histIdx].command`.
- **ArrowDown** (preventDefault): if `histIdx > 0`, decrement and load that command; else if `histIdx === 0`, set `histIdx = -1` and `input = ""`.
- Command history *is* the entry list, so `clear` also wipes ↑/↓ recall.

### 7.5 Other behavior

- After `entries` changes: `window.scrollTo(0, document.body.scrollHeight)`.
- `onClick` on `.tp-cli-body` focuses the input.
- Input attributes: `type="text"`, `spellCheck={false}`, `autoFocus`, `autoComplete="off"`, `autoCapitalize="off"`, `autoCorrect="off"`, `aria-label="terminal input"`.
- Commands are case-sensitive (`LS` → command not found).

### 7.6 Output rendering + linkify (`lib/linkify.tsx`)

String output renders inside `div.tp-cli-output` (accent color, `pre-wrap` keeps newlines and alignment). Before rendering, split the string with

```ts
const LINK_RE = /(https?:\/\/[^\s]+|[\w.+-]+@[\w-]+\.[\w.]+)/g;
```

and render each matching part as `<a className="tp-link" href={part.startsWith("http") ? part : `mailto:${part}`} target="_blank" rel="noopener noreferrer">{part}</a>`; non-matching parts stay as text. Links therefore show in `--tp-link` grey with underline, not accent.

---

## 8. Commands (`commands.ts`)

Parse: `const [cmd, ...args] = input.trim().split(/\s+/)`.

`runCommand(input, cwd)` returns `{ output: string | { kind: "welcome" }, cwd: string, toggleToGui?: boolean }`.

### 8.1 Path resolution

```ts
function resolve(start: string, segments: string[], cmdName: string)
  : { dir: string; ok: boolean; warning: string } {
  let dir = start;
  for (const seg of segments) {
    if (seg === "." || seg === "") continue;
    if (seg === "..") { const p = tree[dir].parent; if (p) dir = p; continue; }   // ".." at home is a no-op
    if (seg === "~") { dir = "~"; continue; }
    if (seg.includes(".")) return { dir, ok: false, warning: `${cmdName}: not a directory: ${seg}` };
    if (tree[dir].children.includes(seg)) { dir = seg; continue; }
    return { dir, ok: false, warning: `${cmdName}: no such file or directory: ${seg}` };
  }
  return { dir, ok: true, warning: "" };
}
```

Paths are split on `/`, so `about/intro.txt`, `../contact.txt`, `~/experience` and `./about` all work.

### 8.2 Command table

| Command | Behavior | Exact output |
|---|---|---|
| `ls` | No args: children of cwd. | names joined by `\n` |
| `ls A [B…]` | Resolve each arg with `resolve(cwd, arg.split("/"), "ls")`. Failed → its warning. With **one** arg → children joined by `\n`. With **several** → prefix each block with `` `${dir}:\n` ``. | blocks joined by `\n\n` |
| `cd` | No args → cwd = `~`. | `""` (no output) |
| `cd A B` | More than one arg. | `cd: too many arguments` |
| `cd A` | `resolve(cwd, A.split("/"), "cd")`; if ok set cwd. | `""` on success, else the warning |
| `cat` | No args. | `cat: missing file operand` |
| `cat F [G…]` | For each arg: `parts = arg.split("/")`, `name = parts.pop()`, resolve `parts` with cmd name `cat` (fail → warning). If `name` is not in that dir's children: find any folder that contains it; if found and different from the resolved dir, append `` ` (try \`cat ${hintPath}/${name}\`)` `` where `hintPath` is `~` for home or the folder's path relative to home without the `~/` (e.g. `about`). If found: a name with `.` returns its file text; a name without `.` returns `cat: ${name}: Is a directory`. | blocks joined by `\n\n`; not-found message is `` `cat: ${name}: No such file or directory${hint}` `` |
| `tree` | Whole tree from home (see below). | string |
| `pwd` | `pathOf(cwd)` | `~` or `~/about` |
| `help` (and any name in `welcome.commandNames`) | Show the welcome panel. | `{ kind: "welcome" }` |
| `toggle` | Switch to GUI mode. | `""` |
| `clear` | Handled in the key handler (§7.4). | — |
| anything else | | ``` `zsh: command not found: ${cmd}\nStuck? Type \`help\`` ``` |

### 8.3 `tree` format

```ts
function render(dir: string, prefix = ""): string {
  const kids = tree[dir].children;
  return kids.map((name, i) => {
    const last = i === kids.length - 1;
    const line = `${prefix}${last ? "└── " : "├── "}${name}`;
    return tree[name] ? `${line}\n${render(name, prefix + (last ? "    " : "│   "))}` : line;
  }).join("\n");
}
// output: "~\n" + render("~")
```

Expected with the default tree:

```
~
├── about
│   ├── intro.txt
│   └── education.txt
├── experience
│   ├── work.txt
│   └── research.txt
├── projects.txt
└── contact.txt
```

---

## 9. Welcome panel (`WelcomePanel.tsx` + `PixelSprite.tsx`)

A bordered box that looks like a CLI tool's startup screen: accent 1px border, 6px radius, title text sitting *on* the top border (absolutely positioned with page-colored background so it "cuts" the line). Two columns: left 38%, right fills; stacks vertically under 640px.

Markup and copy (bold = `.tp-claude-cmd` span):

```
.tp-claude
  .tp-claude-title         "{welcome.title} " + <span.tp-muted>{welcome.version}</span>
  .tp-claude-left
    .tp-claude-welcome     "Welcome to {firstName}'s terminal!"
    <PixelSprite/>
    .tp-claude-meta        "{welcome.metaLine}" <br/> <span.tp-claude-cwd>{welcome.cwdLabel}</span>
  .tp-claude-right
    .tp-claude-heading     "Getting around"
    .tp-claude-row         **ls** lists what's here — **ls about** peeks into a folder without moving
    .tp-claude-row         **cd about** goes in, **cd ..** goes back up, **cd** alone returns home to ~
    .tp-claude-row         **cat intro.txt** prints a file — paths work too, like **cat about/intro.txt**
    .tp-claude-sep
    .tp-claude-heading     "Good to know"
    .tp-claude-row         Anything ending in .txt is a file you can cat; everything else is a folder you can cd into
    .tp-claude-row         **pwd** · **tree** · **clear** · **toggle** for the normal website
    .tp-claude-note        start with **ls**, and cat contact.txt to reach the human
```

If the tree's folder/file names change, update the example names (`about`, `intro.txt`, `contact.txt`) to match real entries.

**PixelSprite:** a 12-column CSS grid of 7×7px cells. Define the sprite as an array of 12-character strings; `#` renders `span.tp-px.tp-px--on` (accent square), `.` renders `span.tp-px` (empty). Use this original sprite (a little monitor with a `>_` prompt); the owner may swap in their own design later:

```ts
const SPRITE = [
  "############",
  "#..........#",
  "#.#........#",
  "#..#.......#",
  "#.#..####..#",
  "#..........#",
  "############",
  "....####....",
  "..########..",
];
```

Do not copy a mascot, logo or product name from any existing tool or brand into the panel.

---

## 10. GUI mode (`GuiView.tsx`)

Rendered inside `.tp-shell.tp-shell--gui`, toggle label reads `cli mode`.

```
.tp-name                 {fullName}
.tp-links                <a.tp-link> for each guiLinks item (http links: target="_blank" rel="noopener noreferrer"; mailto: no target)
hr.tp-hr.tp-hr--accent
.tp-intro                <p> per intro.paragraphs
hr.tp-hr
.tp-section  EXPERIENCE  li: `${title} @ ${company}`
.tp-section  PROJECTS    li: `${name}`
.tp-section  RESEARCH    li: `${title} (${role})`
.tp-section  COURSEWORK  li: `${code} — ${name} (${grade})`      // em dash
hr.tp-hr.tp-hr--accent
.tp-footer               `© ${new Date().getFullYear()} ${fullName}`
```

Section titles are literal uppercase strings in `.tp-section-title`; lists are `ul.tp-list`. Skip any section whose array is empty.

---

## 11. Mode toggle (`App.tsx`)

- `const [mode, setMode] = useState<"cli" | "gui">("cli")` — not persisted; every load starts in CLI.
- The toggle `<button className="tp-toggle">` is the first child of `.tp-shell`; label is `gui mode` in CLI and `cli mode` in GUI.
- The `toggle` command calls the same switch.
- Render CLI and GUI conditionally (not hidden with CSS), so switching back to CLI starts a fresh session (empty history, cwd `~`).
- On switching to GUI, `window.scrollTo(0, 0)`.

---

## 12. Optional enhancements (build only if asked)

1. **Tab completion** in the input for command names and for children of the resolved directory.
2. **Project detail files:** turn `projects.txt` into a `projects/` folder with one `slug.txt` per project (name, description, tech, url), and link project names in GUI mode when `url` is set.
3. **Remember mode** in `localStorage` (wrap in try/catch).
4. **`open <name>`** command that opens a contact/project URL in a new tab.
5. **Boot line:** show a single muted line on load such as `type help to get started`.

---

## 13. Acceptance checks

Write these as Vitest cases against `runCommand` (using fixture content), then also verify by hand in the browser. Default tree from §5.1; `$` lines are inputs.

| # | cwd | Input | Expected output | cwd after |
|---|---|---|---|---|
| 1 | `~` | `ls` | `about\nexperience\nprojects.txt\ncontact.txt` | `~` |
| 2 | `~` | `ls about` | `intro.txt\neducation.txt` | `~` |
| 3 | `~` | `ls about experience` | `about:\nintro.txt\neducation.txt\n\nexperience:\nwork.txt\nresearch.txt` | `~` |
| 4 | `~` | `ls nope` | `ls: no such file or directory: nope` | `~` |
| 5 | `~` | `ls contact.txt` | `ls: not a directory: contact.txt` | `~` |
| 6 | `~` | `cd about` | *(nothing)* | `about` |
| 7 | `about` | `pwd` | `~/about` | `about` |
| 8 | `about` | `cd ..` | *(nothing)* | `~` |
| 9 | `about` | `cd` | *(nothing)* | `~` |
| 10 | `~` | `cd a b` | `cd: too many arguments` | `~` |
| 11 | `~` | `cd about/intro.txt` | `cd: not a directory: intro.txt` | `~` |
| 12 | `~` | `cd ../about` | *(nothing)* | `about` |
| 13 | `~` | `cat` | `cat: missing file operand` | `~` |
| 14 | `~` | `cat intro.txt` | ``cat: intro.txt: No such file or directory (try `cat about/intro.txt`)`` | `~` |
| 15 | `~` | `cat about/intro.txt` | contents of intro.txt | `~` |
| 16 | `~` | `cat about` | `cat: about: Is a directory` | `~` |
| 17 | `about` | `cat contact.txt` | ``cat: contact.txt: No such file or directory (try `cat ~/contact.txt`)`` | `about` |
| 18 | `about` | `cat ../contact.txt` | contents of contact.txt | `about` |
| 19 | `~` | `cat projects.txt contact.txt` | both files separated by one blank line | `~` |
| 20 | `~` | `tree` | exactly the block in §8.3 | `~` |
| 21 | `~` | `foo` | ``zsh: command not found: foo\nStuck? Type `help` `` | `~` |
| 22 | `~` | `LS` | ``zsh: command not found: LS\nStuck? Type `help` `` | `~` |

UI checks:
- [ ] On load: only the prompt `{promptUser} ~ %` with focused input and `gui mode` at top right, ~9rem from the top.
- [ ] `help` shows the panel with title on the border, sprite, meta bottom-left, two headed sections on the right; stacks on a 375px-wide viewport.
- [ ] Past entries keep the directory they were run from (`cd about` entry shows `~`; the next prompt shows `about`).
- [ ] Emails and URLs inside `cat contact.txt` output are clickable; emails open `mailto:`.
- [ ] ↑/↓ cycle through previous commands; ↓ past the newest clears the input.
- [ ] `clear` empties the screen and the ↑ history; whitespace-only Enter does nothing.
- [ ] Clicking anywhere in the empty area below the prompt focuses the input.
- [ ] `toggle` and the button both switch to GUI; the button in GUI says `cli mode` and switching back gives a fresh terminal.
- [ ] GUI mode matches §10, empty sections are hidden, footer shows the current year.
- [ ] Output text is accent tan with preserved alignment in `education.txt` and `contact.txt`.

---

## 14. Content the owner will provide

Gather these to replace the placeholders in `src/content.ts`:

- Full name, first name, terminal handle (for `guest@handle` and `~/handle`)
- Browser tab title; welcome panel title (e.g. `yourname.sh`) and version string
- GitHub, LinkedIn, and email links
- 3–4 intro paragraphs (first one a short greeting)
- School, degree, GPA label and value (optional)
- Experience: title + company for each
- Projects: name for each (optionally description, URL, tech for enhancement #2)
- Research: title + role for each (or leave empty to hide the section)
- Coursework: code, name, grade for each
- Contact rows for `contact.txt`
- Optional: your own 12-column pixel sprite