import { content, type Content } from "./content";

// Virtual filesystem rules:
// - The tree is a flat map from folder name -> node. "~" is home. The order of
//   `children` is display order.
// - A name containing "." is a FILE; a name with no "." is a FOLDER and must be
//   a key in the tree.
// - Folder names are unique across the whole tree, and so are file names: file
//   contents live in a flat `files` record keyed by file name.
// - A file whose content would be empty (its section in content.ts is empty) is
//   left out, and a folder left with no children is left out too.

export type Node = { parent: string | null; children: string[] };
export type Tree = Record<string, Node>;
export type VirtualFs = { tree: Tree; files: Record<string, string> };

export const HOME = "~";

// Where each folder's entries would go if every section had content.
const LAYOUT: Record<string, string[]> = {
  [HOME]: ["about", "experience", "projects.txt", "contact.txt"],
  about: ["intro.txt", "education.txt"],
  experience: ["work.txt", "research.txt"],
};

export const isFile = (name: string) => name.includes(".");

function educationText({ education, coursework }: Content): string {
  const lines = [`${education.school} -- ${education.degree}`];
  if (education.gpa !== undefined) lines.push(`${education.gpaLabel}: ${education.gpa}`);
  if (coursework.length > 0) {
    // The code column appears only if some course has a code; a course with
    // no grade ends at its name.
    const maxCode = Math.max(...coursework.map((c) => (c.code ?? "").length));
    const maxName = Math.max(...coursework.map((c) => c.name.length));
    lines.push("", "Coursework:");
    for (const c of coursework) {
      const code = maxCode > 0 ? `${(c.code ?? "").padEnd(maxCode)} -- ` : "";
      const name = c.grade ? `${c.name.padEnd(maxName)}   ${c.grade}` : c.name;
      lines.push(`  ${code}${name}`);
    }
  }
  return lines.join("\n");
}

function contactText({ contact }: Content): string {
  if (contact.length === 0) return "";
  const width = Math.max(...contact.map((row) => row.label.length + 1)) + 1;
  return contact.map((row) => `${(row.label + ":").padEnd(width)}${row.value}`).join("\n");
}

function fileContents(c: Content): Record<string, string> {
  return {
    "intro.txt": (c.intro.cliParagraphs ?? c.intro.paragraphs).join("\n\n"),
    "education.txt": educationText(c),
    "work.txt": c.experience.map((e) => `${e.title} @ ${e.company}`).join("\n"),
    "research.txt": c.research.map((r) => `${r.title}\n  ${r.role}`).join("\n\n"),
    "projects.txt": c.projects.map((p, i) => `[${i + 1}] ${p.name}`).join("\n"),
    "contact.txt": contactText(c),
  };
}

export function buildFs(c: Content): VirtualFs {
  const contents = fileContents(c);
  const tree: Tree = {};
  const files: Record<string, string> = {};

  // Returns whether `name` survives pruning; registers it if so.
  const keep = (name: string, parent: string | null): boolean => {
    if (isFile(name)) {
      if (!contents[name]) return false;
      files[name] = contents[name];
      return true;
    }
    const children = (LAYOUT[name] ?? []).filter((child) => keep(child, name));
    if (children.length === 0 && parent !== null) return false;
    tree[name] = { parent, children };
    return true;
  };
  keep(HOME, null);

  return { tree, files };
}

export const fs = buildFs(content);

// "~", "~/about", "~/a/b", ... built by walking parent links.
export function pathOf(folder: string, tree: Tree = fs.tree): string {
  const parts: string[] = [];
  for (let dir: string | null = folder; dir !== null; dir = tree[dir].parent) parts.unshift(dir);
  return parts.join("/");
}
