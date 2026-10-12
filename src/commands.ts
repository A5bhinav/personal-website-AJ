import { content } from "./content";
import { fs, HOME, isFile, pathOf, type Tree, type VirtualFs } from "./fs";

export type CommandOutput = string | { kind: "welcome" };
export type CommandResult = { output: CommandOutput; cwd: string; toggleToGui?: boolean };

// What the commands run against. Defaults to the site's real content; tests
// pass a fixture.
export type CommandEnv = { fs: VirtualFs; welcomeCommands: string[] };

const defaultEnv: CommandEnv = { fs, welcomeCommands: content.welcome.commandNames };

function resolve(
  tree: Tree,
  start: string,
  segments: string[],
  cmdName: string,
): { dir: string; ok: boolean; warning: string } {
  let dir = start;
  for (const seg of segments) {
    if (seg === "." || seg === "") continue;
    if (seg === "..") {
      const parent = tree[dir].parent; // ".." at home is a no-op
      if (parent) dir = parent;
      continue;
    }
    if (seg === HOME) {
      dir = HOME;
      continue;
    }
    if (isFile(seg)) return { dir, ok: false, warning: `${cmdName}: not a directory: ${seg}` };
    if (tree[dir].children.includes(seg)) {
      dir = seg;
      continue;
    }
    return { dir, ok: false, warning: `${cmdName}: no such file or directory: ${seg}` };
  }
  return { dir, ok: true, warning: "" };
}

function ls(tree: Tree, cwd: string, args: string[]): string {
  if (args.length === 0) return tree[cwd].children.join("\n");
  return args
    .map((arg) => {
      const target = resolve(tree, cwd, arg.split("/"), "ls");
      if (!target.ok) return target.warning;
      const listing = tree[target.dir].children.join("\n");
      return args.length === 1 ? listing : `${target.dir}:\n${listing}`;
    })
    .join("\n\n");
}

function cat({ tree, files }: VirtualFs, cwd: string, args: string[]): string {
  if (args.length === 0) return "cat: missing file operand";
  return args
    .map((arg) => {
      const parts = arg.split("/");
      const name = parts.pop() ?? "";
      const target = resolve(tree, cwd, parts, "cat");
      if (!target.ok) return target.warning;

      // "about/", ".", ".." and "~" name a directory rather than an entry in one.
      if (name === "" || name === "." || name === ".." || name === HOME) {
        return `cat: ${arg}: Is a directory`;
      }
      if (!tree[target.dir].children.includes(name)) {
        const owner = isFile(name)
          ? Object.keys(tree).find((dir) => tree[dir].children.includes(name))
          : undefined;
        const hint = owner ? ` (try \`cat ${pathOf(owner, tree).replace(/^~\//, "")}/${name}\`)` : "";
        return `cat: ${name}: No such file or directory${hint}`;
      }
      return isFile(name) ? files[name] : `cat: ${name}: Is a directory`;
    })
    .join("\n\n");
}

function renderTree(tree: Tree, dir: string, prefix = ""): string {
  const kids = tree[dir].children;
  return kids
    .map((name, i) => {
      const last = i === kids.length - 1;
      const line = `${prefix}${last ? "└── " : "├── "}${name}`;
      return tree[name]
        ? `${line}\n${renderTree(tree, name, prefix + (last ? "    " : "│   "))}`
        : line;
    })
    .join("\n");
}

export function runCommand(input: string, cwd: string, env: CommandEnv = defaultEnv): CommandResult {
  const { tree } = env.fs;
  const [cmd, ...args] = input.trim().split(/\s+/);

  if (env.welcomeCommands.includes(cmd)) return { output: { kind: "welcome" }, cwd };

  switch (cmd) {
    case "":
      return { output: "", cwd };
    case "ls":
      return { output: ls(tree, cwd, args), cwd };
    case "cd": {
      if (args.length === 0) return { output: "", cwd: HOME };
      if (args.length > 1) return { output: "cd: too many arguments", cwd };
      const target = resolve(tree, cwd, args[0].split("/"), "cd");
      return target.ok ? { output: "", cwd: target.dir } : { output: target.warning, cwd };
    }
    case "cat":
      return { output: cat(env.fs, cwd, args), cwd };
    case "tree":
      return { output: `${HOME}\n${renderTree(tree, HOME)}`, cwd };
    case "pwd":
      return { output: pathOf(cwd, tree), cwd };
    case "help":
      return { output: { kind: "welcome" }, cwd };
    case "toggle":
      return { output: "", cwd, toggleToGui: true };
    case "clear":
      return { output: "", cwd }; // the terminal wipes the screen itself
    default:
      return { output: `zsh: command not found: ${cmd}\nStuck? Type \`help\``, cwd };
  }
}
