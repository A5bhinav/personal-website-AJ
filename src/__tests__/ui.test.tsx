import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { content } from "../content";
import { fs } from "../fs";
import { linkify } from "../lib/linkify";

const scrollTo = vi.fn();

beforeEach(() => {
  scrollTo.mockClear();
  window.scrollTo = scrollTo;
});
afterEach(cleanup);

const setup = () => {
  const user = userEvent.setup();
  const { container } = render(<App />);
  const input = () => screen.getByLabelText<HTMLInputElement>("terminal input");
  const run = (command: string) => user.type(input(), `${command}{Enter}`);
  const entries = () => [...container.querySelectorAll<HTMLElement>(".tp-cli-entry")];
  const livePrompt = () => container.querySelector<HTMLElement>(".tp-cli-body > .tp-prompt-line")!;
  return { user, container, input, run, entries, livePrompt };
};

describe("CLI mode", () => {
  it("loads with only a focused prompt and the gui toggle", () => {
    const { container, input, entries, livePrompt } = setup();
    expect(container.querySelector(".tp-shell--cli")).not.toBeNull();
    expect(entries()).toHaveLength(0);
    expect(container.querySelector(".tp-claude")).toBeNull();
    expect(document.activeElement).toBe(input());
    expect(livePrompt().querySelector(".tp-prompt-user")).toHaveProperty("textContent", content.site.promptUser);
    expect(livePrompt().querySelector(".tp-prompt-tilde")).toHaveProperty("textContent", "~");
    expect(livePrompt().querySelector(".tp-prompt-symbol")).toHaveProperty("textContent", "%");
    expect(screen.getByRole("button").textContent).toBe("gui mode");
    expect(container.querySelector(".tp-shell")!.firstElementChild).toBe(screen.getByRole("button"));
  });

  it("prints command output under the command and clears the input", async () => {
    const { run, input, entries } = setup();
    await run("ls");
    expect(entries()).toHaveLength(1);
    expect(entries()[0].querySelector(".tp-prompt-line")!.textContent).toBe(`${content.site.promptUser}~%ls`);
    expect(entries()[0].querySelector(".tp-cli-output")!.textContent).toBe(fs.tree["~"].children.join("\n"));
    expect(input().value).toBe("");
    expect(scrollTo).toHaveBeenLastCalledWith(0, document.body.scrollHeight);
  });

  it("keeps the directory each entry was run from", async () => {
    const { run, entries, livePrompt } = setup();
    await run("cd about");
    await run("pwd");
    expect(entries()[0].querySelector(".tp-prompt-tilde")!.textContent).toBe("~");
    expect(entries()[0].querySelector(".tp-cli-output")).toBeNull();
    expect(entries()[1].querySelector(".tp-prompt-tilde")!.textContent).toBe("about");
    expect(entries()[1].querySelector(".tp-cli-output")!.textContent).toBe("~/about");
    expect(livePrompt().querySelector(".tp-prompt-tilde")!.textContent).toBe("about");
  });

  it("shows the welcome panel for help, built from content", async () => {
    const { run, entries } = setup();
    await run("help");
    const panel = entries()[0].querySelector<HTMLElement>(".tp-claude")!;
    expect(panel.querySelector(".tp-claude-title")!.textContent).toBe(
      `${content.welcome.title} ${content.welcome.version}`,
    );
    expect(panel.querySelector(".tp-claude-welcome")!.textContent).toBe(
      `Welcome to ${content.site.firstName}'s terminal!`,
    );
    expect(panel.querySelector(".tp-claude-meta")!.textContent).toBe(
      `${content.welcome.metaLine}${content.welcome.cwdLabel}`,
    );
    expect(panel.querySelectorAll(".tp-px")).toHaveLength(12 * 9);
    expect(panel.querySelectorAll(".tp-px--on")).toHaveLength(53);
    expect([...panel.querySelectorAll(".tp-claude-heading")].map((h) => h.textContent)).toEqual([
      "Tips for getting started",
      "Good to know",
    ]);
    expect([...panel.querySelectorAll(".tp-claude-row, .tp-claude-note")].map((r) => r.textContent)).toEqual([
      "ls lists what's here — ls about peeks into a folder without moving",
      "cd about goes in, cd .. goes back up, cd alone returns home to ~",
      "cat intro.txt prints a file — paths work too, like cat about/intro.txt",
      "Anything ending in .txt is a file you can cat; everything else is a folder you can cd into",
      "pwd · tree · clear · toggle for the normal website",
      "start with ls, and cat contact.txt to reach the human",
    ]);
    expect(entries()[0].querySelector(".tp-cli-output")).toBeNull();
  });

  it("turns emails and URLs in output into links", async () => {
    const { run, entries } = setup();
    await run("cat contact.txt");
    const output = entries()[0].querySelector<HTMLElement>(".tp-cli-output")!;
    expect(output.textContent).toBe(fs.files["contact.txt"]);
    const links = within(output).getAllByRole("link");
    expect(links.map((a) => a.getAttribute("href"))).toEqual(
      content.contact.map((row) => (row.value.startsWith("http") ? row.value : `mailto:${row.value}`)),
    );
    for (const a of links) {
      expect(a.className).toBe("tp-link");
      expect(a.getAttribute("target")).toBe("_blank");
      expect(a.getAttribute("rel")).toBe("noopener noreferrer");
    }
  });

  it("cycles history with the arrow keys", async () => {
    const { user, run, input } = setup();
    await user.keyboard("{ArrowUp}");
    expect(input().value).toBe("");
    await run("ls");
    await run("pwd");
    await run("tree");
    await user.keyboard("{ArrowUp}");
    expect(input().value).toBe("tree");
    await user.keyboard("{ArrowUp}{ArrowUp}");
    expect(input().value).toBe("ls");
    await user.keyboard("{ArrowUp}");
    expect(input().value).toBe("ls"); // stops at the oldest
    await user.keyboard("{ArrowDown}");
    expect(input().value).toBe("pwd");
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(input().value).toBe(""); // down past the newest clears
    await user.keyboard("{ArrowDown}");
    expect(input().value).toBe("");
    await user.keyboard("{ArrowUp}");
    expect(input().value).toBe("tree");
  });

  it("re-runs a recalled command and restarts recall from the newest", async () => {
    const { user, run, input, entries } = setup();
    await run("pwd");
    await run("ls");
    await user.keyboard("{ArrowUp}{ArrowUp}{Enter}");
    expect(entries()).toHaveLength(3);
    expect(entries()[2].querySelector(".tp-cli-output")!.textContent).toBe("~");
    await user.keyboard("{ArrowUp}");
    expect(input().value).toBe("pwd");
  });

  it("clear empties the screen and the history", async () => {
    const { user, run, input, entries } = setup();
    await run("ls");
    await run("cd about");
    await run("clear");
    expect(entries()).toHaveLength(0);
    expect(input().value).toBe("");
    await user.keyboard("{ArrowUp}");
    expect(input().value).toBe("");
    await run("pwd");
    expect(entries()[0].querySelector(".tp-cli-output")!.textContent).toBe("~/about"); // cwd survives clear
  });

  it("ignores Enter on empty or whitespace-only input", async () => {
    const { user, input, entries } = setup();
    await user.keyboard("{Enter}");
    await user.type(input(), "   {Enter}");
    expect(entries()).toHaveLength(0);
    expect(input().value).toBe("   ");
  });

  it("reports unknown and wrongly-cased commands", async () => {
    const { run, entries } = setup();
    await run("LS");
    expect(entries()[0].querySelector(".tp-cli-output")!.textContent).toBe(
      "zsh: command not found: LS\nStuck? Type `help`",
    );
  });

  it("focuses the input when the terminal body is clicked", async () => {
    const { user, container, input } = setup();
    input().blur();
    expect(document.activeElement).not.toBe(input());
    await user.click(container.querySelector(".tp-cli-body")!);
    expect(document.activeElement).toBe(input());
  });
});

describe("mode toggle", () => {
  it("switches with the button, and back to a fresh terminal", async () => {
    const { user, container, run, entries, livePrompt } = setup();
    await run("cd about");
    await user.click(screen.getByRole("button", { name: "gui mode" }));
    expect(container.querySelector(".tp-shell--gui")).not.toBeNull();
    expect(container.querySelector(".tp-cli-body")).toBeNull();
    expect(scrollTo).toHaveBeenLastCalledWith(0, 0);

    await user.click(screen.getByRole("button", { name: "cli mode" }));
    expect(container.querySelector(".tp-shell--cli")).not.toBeNull();
    expect(entries()).toHaveLength(0);
    expect(livePrompt().querySelector(".tp-prompt-tilde")!.textContent).toBe("~");
    expect(document.activeElement).toBe(screen.getByLabelText("terminal input"));
  });

  it("switches with the toggle command", async () => {
    const { container, run } = setup();
    await run("toggle");
    expect(container.querySelector(".tp-shell--gui")).not.toBeNull();
    expect(screen.getByRole("button").textContent).toBe("cli mode");
    expect(scrollTo).toHaveBeenLastCalledWith(0, 0);
  });
});

describe("GUI mode", () => {
  const openGui = async () => {
    const ctx = setup();
    await ctx.user.click(screen.getByRole("button", { name: "gui mode" }));
    return ctx.container.querySelector<HTMLElement>(".tp-shell--gui")!;
  };

  it("renders name, links, intro and footer from content", async () => {
    const shell = await openGui();
    expect(shell.querySelector(".tp-name")!.textContent).toBe(content.site.fullName);
    const links = [...shell.querySelectorAll<HTMLAnchorElement>(".tp-links a.tp-link")];
    expect(links.map((a) => [a.textContent, a.getAttribute("href")])).toEqual(
      content.guiLinks.map((l) => [l.label, l.href]),
    );
    for (const a of links) {
      const external = a.getAttribute("href")!.startsWith("http");
      expect(a.getAttribute("target")).toBe(external ? "_blank" : null);
      expect(a.getAttribute("rel")).toBe(external ? "noopener noreferrer" : null);
    }
    expect([...shell.querySelectorAll(".tp-intro p")].map((p) => p.textContent)).toEqual(content.intro.paragraphs);
    expect(shell.querySelector(".tp-footer")!.textContent).toBe(
      `© ${new Date().getFullYear()} ${content.site.fullName}`,
    );
  });

  it("lays the page out in the specified order", async () => {
    const shell = await openGui();
    expect([...shell.children].map((el) => el.className)).toEqual([
      "tp-toggle",
      "tp-name",
      "tp-links",
      "tp-hr tp-hr--accent",
      "tp-intro",
      "tp-hr",
      "tp-section",
      "tp-section",
      "tp-section",
      "tp-section",
      "tp-hr tp-hr--accent",
      "tp-footer",
    ]);
  });

  it("formats each section's list items", async () => {
    const shell = await openGui();
    const sections = Object.fromEntries(
      [...shell.querySelectorAll(".tp-section")].map((s) => [
        s.querySelector(".tp-section-title")!.textContent,
        [...s.querySelectorAll("ul.tp-list > li")].map((li) => li.textContent),
      ]),
    );
    expect(Object.keys(sections)).toEqual(["EXPERIENCE", "PROJECTS", "RESEARCH", "COURSEWORK"]);
    const [job] = content.experience;
    const [project] = content.projects;
    const [paper] = content.research;
    const [course] = content.coursework;
    expect(sections.EXPERIENCE[0]).toBe(`${job.title} @ ${job.company}`);
    expect(sections.PROJECTS[0]).toBe(project.name);
    expect(sections.RESEARCH[0]).toBe(`${paper.title} (${paper.role})`);
    expect(sections.COURSEWORK[0]).toBe(`${course.code} — ${course.name} (${course.grade})`);
    expect(sections.COURSEWORK).toHaveLength(content.coursework.length);
  });
});

describe("GUI mode with empty sections", () => {
  afterEach(() => {
    vi.doUnmock("../content");
    vi.resetModules();
  });

  it("hides sections whose arrays are empty", async () => {
    vi.resetModules();
    vi.doMock("../content", () => ({ content: { ...content, research: [], projects: [] } }));
    const { GuiView } = await import("../components/GuiView");
    const { container } = render(<GuiView />);
    expect([...container.querySelectorAll(".tp-section-title")].map((t) => t.textContent)).toEqual([
      "EXPERIENCE",
      "COURSEWORK",
    ]);
  });
});

describe("linkify", () => {
  const html = (text: string) => render(<p>{linkify(text)}</p>).container.querySelector("p")!;

  it("leaves plain text alone", () => {
    const p = html("just some text\n  with lines");
    expect(p.textContent).toBe("just some text\n  with lines");
    expect(p.querySelector("a")).toBeNull();
  });

  it("links URLs and emails and keeps the text around them", () => {
    const p = html("Email:  a.b+c@mail.example.com\nSite:   https://example.com/x?y=1 ok http://plain.test");
    expect(p.textContent).toBe("Email:  a.b+c@mail.example.com\nSite:   https://example.com/x?y=1 ok http://plain.test");
    expect([...p.querySelectorAll("a")].map((a) => a.getAttribute("href"))).toEqual([
      "mailto:a.b+c@mail.example.com",
      "https://example.com/x?y=1",
      "http://plain.test",
    ]);
  });
});
