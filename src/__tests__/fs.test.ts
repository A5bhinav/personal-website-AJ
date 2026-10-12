import { describe, expect, it } from "vitest";
import type { Content } from "../content";
import { buildFs, fs, pathOf } from "../fs";
import { fixture } from "./fixture";

const built = buildFs(fixture);

describe("tree", () => {
  it("has the default shape when every section has content", () => {
    expect(built.tree).toEqual({
      "~": { parent: null, children: ["about", "experience", "projects.txt", "contact.txt"] },
      about: { parent: "~", children: ["intro.txt", "education.txt"] },
      experience: { parent: "~", children: ["work.txt", "research.txt"] },
    });
  });

  it("stores a text for every file in the tree, and nothing else", () => {
    const listed = Object.values(built.tree)
      .flatMap((node) => node.children)
      .filter((name) => name.includes("."));
    expect(Object.keys(built.files).sort()).toEqual(listed.sort());
  });

  it("builds paths by walking parents", () => {
    expect(pathOf("~", built.tree)).toBe("~");
    expect(pathOf("about", built.tree)).toBe("~/about");
    expect(pathOf("b", { "~": { parent: null, children: ["a"] }, a: { parent: "~", children: ["b"] }, b: { parent: "a", children: ["x.txt"] } })).toBe("~/a/b");
  });
});

describe("file contents", () => {
  it("intro.txt joins paragraphs with a blank line", () => {
    expect(built.files["intro.txt"]).toBe("Hey, I'm Test.\n\nSecond paragraph.");
  });

  it("intro.txt prefers cliParagraphs when given", () => {
    const { files } = buildFs({ ...fixture, intro: { ...fixture.intro, cliParagraphs: ["cli only"] } });
    expect(files["intro.txt"]).toBe("cli only");
  });

  it("education.txt lines up course columns", () => {
    expect(built.files["education.txt"]).toBe(
      [
        "Test University -- B.S. Testing",
        "Technical GPA: 3.9",
        "",
        "Coursework:",
        "  CS 101    -- Intro            A",
        "  MATH 2210 -- Linear Algebra   in progress",
      ].join("\n"),
    );
  });

  it("education.txt drops the GPA line and the coursework block when absent", () => {
    const { files } = buildFs({
      ...fixture,
      education: { ...fixture.education, gpa: undefined },
      coursework: [],
    });
    expect(files["education.txt"]).toBe("Test University -- B.S. Testing");
  });

  it("work.txt, research.txt and projects.txt follow their formats", () => {
    expect(built.files["work.txt"]).toBe("Engineer @ Acme\nIntern @ Globex");
    expect(built.files["research.txt"]).toBe("Paper One\n  Lead author\n\nPaper Two\n  Assistant");
    expect(built.files["projects.txt"]).toBe("[1] Alpha\n[2] Beta");
  });

  it("contact.txt lines values up in one column", () => {
    expect(built.files["contact.txt"]).toBe(
      [
        "Email:    someone@example.com",
        "LinkedIn: https://www.linkedin.com/in/someone/",
        "GitHub:   https://github.com/someone",
      ].join("\n"),
    );
  });
});

describe("empty sections", () => {
  const without = (patch: Partial<Content>) => buildFs({ ...fixture, ...patch });

  it("omits research.txt when there is no research", () => {
    const { tree, files } = without({ research: [] });
    expect(tree.experience.children).toEqual(["work.txt"]);
    expect(files).not.toHaveProperty("research.txt");
  });

  it("omits projects.txt when there are no projects", () => {
    const { tree, files } = without({ projects: [] });
    expect(tree["~"].children).toEqual(["about", "experience", "contact.txt"]);
    expect(files).not.toHaveProperty("projects.txt");
  });

  it("omits a folder that ends up with no children", () => {
    const { tree } = without({ experience: [], research: [] });
    expect(tree).not.toHaveProperty("experience");
    expect(tree["~"].children).toEqual(["about", "projects.txt", "contact.txt"]);
  });

  it("keeps home even if everything optional is empty", () => {
    const { tree } = without({ experience: [], research: [], projects: [], contact: [] });
    expect(tree["~"]).toEqual({ parent: null, children: ["about"] });
  });
});

describe("placeholder content", () => {
  it("builds the full default tree", () => {
    expect(Object.keys(fs.tree)).toEqual(["about", "experience", "~"]);
    expect(fs.tree["~"].children).toEqual(["about", "experience", "projects.txt", "contact.txt"]);
  });
});
