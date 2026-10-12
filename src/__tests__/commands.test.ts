import { describe, expect, it } from "vitest";
import { runCommand, type CommandEnv } from "../commands";
import type { Content } from "../content";
import { buildFs } from "../fs";
import { fixture } from "./fixture";

const envFor = (c: Content): CommandEnv => ({
  fs: buildFs(c),
  welcomeCommands: c.welcome.commandNames,
});

const env = envFor(fixture);
const { files } = env.fs;
const run = (input: string, cwd = "~") => runCommand(input, cwd, env);

const NOT_FOUND = (cmd: string) => `zsh: command not found: ${cmd}\nStuck? Type \`help\``;

const TREE = `~
├── about
│   ├── intro.txt
│   └── education.txt
├── experience
│   ├── work.txt
│   └── research.txt
├── projects.txt
└── contact.txt`;

// README §13: [#, cwd, input, expected output, cwd after]
const ACCEPTANCE: [number, string, string, string, string][] = [
  [1, "~", "ls", "about\nexperience\nprojects.txt\ncontact.txt", "~"],
  [2, "~", "ls about", "intro.txt\neducation.txt", "~"],
  [3, "~", "ls about experience", "about:\nintro.txt\neducation.txt\n\nexperience:\nwork.txt\nresearch.txt", "~"],
  [4, "~", "ls nope", "ls: no such file or directory: nope", "~"],
  [5, "~", "ls contact.txt", "ls: not a directory: contact.txt", "~"],
  [6, "~", "cd about", "", "about"],
  [7, "about", "pwd", "~/about", "about"],
  [8, "about", "cd ..", "", "~"],
  [9, "about", "cd", "", "~"],
  [10, "~", "cd a b", "cd: too many arguments", "~"],
  [11, "~", "cd about/intro.txt", "cd: not a directory: intro.txt", "~"],
  [12, "~", "cd ../about", "", "about"],
  [13, "~", "cat", "cat: missing file operand", "~"],
  [14, "~", "cat intro.txt", "cat: intro.txt: No such file or directory (try `cat about/intro.txt`)", "~"],
  [15, "~", "cat about/intro.txt", files["intro.txt"], "~"],
  [16, "~", "cat about", "cat: about: Is a directory", "~"],
  [17, "about", "cat contact.txt", "cat: contact.txt: No such file or directory (try `cat ~/contact.txt`)", "about"],
  [18, "about", "cat ../contact.txt", files["contact.txt"], "about"],
  [19, "~", "cat projects.txt contact.txt", `${files["projects.txt"]}\n\n${files["contact.txt"]}`, "~"],
  [20, "~", "tree", TREE, "~"],
  [21, "~", "foo", NOT_FOUND("foo"), "~"],
  [22, "~", "LS", NOT_FOUND("LS"), "~"],
];

describe("acceptance checks", () => {
  it.each(ACCEPTANCE)("#%i  [%s] $ %s", (_n, cwd, input, output, cwdAfter) => {
    expect(run(input, cwd)).toEqual({ output, cwd: cwdAfter });
  });

  it("file fixtures are non-empty, so the cat cases mean something", () => {
    for (const name of ["intro.txt", "contact.txt", "projects.txt"]) expect(files[name]).toBeTruthy();
  });
});

describe("ls", () => {
  it("lists the current directory when inside a folder", () => {
    expect(run("ls", "experience").output).toBe("work.txt\nresearch.txt");
  });

  it("accepts ~, . and .. in paths", () => {
    expect(run("ls ~/experience", "about").output).toBe("work.txt\nresearch.txt");
    expect(run("ls ./about").output).toBe("intro.txt\neducation.txt");
    expect(run("ls ..", "about").output).toBe("about\nexperience\nprojects.txt\ncontact.txt");
    expect(run("ls ../experience", "about").output).toBe("work.txt\nresearch.txt");
  });

  it("mixes listings and warnings when given several args", () => {
    expect(run("ls about nope").output).toBe(
      "about:\nintro.txt\neducation.txt\n\nls: no such file or directory: nope",
    );
  });

  it("does not see a folder that is not a child of the current one", () => {
    expect(run("ls experience", "about").output).toBe("ls: no such file or directory: experience");
  });
});

describe("cd", () => {
  it("stays put on failure", () => {
    expect(run("cd nope", "about")).toEqual({ output: "cd: no such file or directory: nope", cwd: "about" });
  });

  it("treats .. at home as a no-op", () => {
    expect(run("cd ..")).toEqual({ output: "", cwd: "~" });
    expect(run("cd ../..", "about")).toEqual({ output: "", cwd: "~" });
  });

  it("handles ~, trailing slashes and sideways moves", () => {
    expect(run("cd ~", "about").cwd).toBe("~");
    expect(run("cd about/").cwd).toBe("about");
    expect(run("cd ../experience", "about").cwd).toBe("experience");
    expect(run("cd ~/experience", "about").cwd).toBe("experience");
    expect(run("cd .", "about").cwd).toBe("about");
  });
});

describe("cat", () => {
  it("reads a file in the current directory", () => {
    expect(run("cat intro.txt", "about").output).toBe(files["intro.txt"]);
    expect(run("cat contact.txt").output).toBe(files["contact.txt"]);
  });

  it("reads through ~ and . paths", () => {
    expect(run("cat ~/about/education.txt", "experience").output).toBe(files["education.txt"]);
    expect(run("cat ./projects.txt").output).toBe(files["projects.txt"]);
  });

  it("reports a file that exists nowhere, without a hint", () => {
    expect(run("cat nope.txt").output).toBe("cat: nope.txt: No such file or directory");
  });

  it("reports a bad directory in the path", () => {
    expect(run("cat nope/intro.txt").output).toBe("cat: no such file or directory: nope");
    expect(run("cat contact.txt/x").output).toBe("cat: not a directory: contact.txt");
  });

  it("hints with the folder path when the file lives in a sibling folder", () => {
    expect(run("cat work.txt", "about").output).toBe(
      "cat: work.txt: No such file or directory (try `cat experience/work.txt`)",
    );
  });

  it("calls directories directories", () => {
    expect(run("cat about/").output).toBe("cat: about/: Is a directory");
    expect(run("cat ..", "about").output).toBe("cat: ..: Is a directory");
    expect(run("cat ~", "about").output).toBe("cat: ~: Is a directory");
    expect(run("cat experience", "about").output).toBe("cat: experience: No such file or directory");
  });

  it("keeps going past a failing argument", () => {
    expect(run("cat nope.txt contact.txt").output).toBe(
      `cat: nope.txt: No such file or directory\n\n${files["contact.txt"]}`,
    );
  });
});

describe("other commands", () => {
  it("pwd at home", () => {
    expect(run("pwd")).toEqual({ output: "~", cwd: "~" });
  });

  it("tree prints the whole tree from home wherever it is run", () => {
    expect(run("tree", "about")).toEqual({ output: TREE, cwd: "about" });
  });

  it("help and configured names open the welcome panel", () => {
    expect(run("help")).toEqual({ output: { kind: "welcome" }, cwd: "~" });
    expect(run("welcome", "about")).toEqual({ output: { kind: "welcome" }, cwd: "about" });
  });

  it("toggle asks for GUI mode", () => {
    expect(run("toggle", "about")).toEqual({ output: "", cwd: "about", toggleToGui: true });
  });

  it("ignores surrounding and repeated whitespace", () => {
    expect(run("   ls    about   ").output).toBe("intro.txt\neducation.txt");
  });

  it("is case-sensitive for every command", () => {
    for (const cmd of ["Cat", "CD", "Help", "Tree", "PWD"]) expect(run(cmd).output).toBe(NOT_FOUND(cmd));
  });
});

describe("pruned trees", () => {
  const pruned = envFor({ ...fixture, research: [], projects: [] });

  it("tree and ls reflect missing sections", () => {
    expect(runCommand("tree", "~", pruned).output).toBe(
      "~\n├── about\n│   ├── intro.txt\n│   └── education.txt\n├── experience\n│   └── work.txt\n└── contact.txt",
    );
    expect(runCommand("cat projects.txt", "~", pruned).output).toBe(
      "cat: projects.txt: No such file or directory",
    );
  });
});

describe("default environment", () => {
  it("runs against src/content.ts when no env is passed", () => {
    expect(runCommand("pwd", "about")).toEqual({ output: "~/about", cwd: "about" });
    expect(runCommand("help", "~").output).toEqual({ kind: "welcome" });
  });
});
