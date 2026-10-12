import type { Content } from "../content";

// Stand-in content so tests don't depend on whatever is in src/content.ts.
export const fixture: Content = {
  site: {
    tabTitle: "Test Person",
    fullName: "Test Person",
    firstName: "Test",
    promptUser: "guest@test",
  },
  welcome: {
    title: "test.sh",
    version: "v9.9.9",
    metaLine: "zsh · guest session",
    cwdLabel: "~/test",
    commandNames: ["help", "welcome"],
  },
  guiLinks: [
    { label: "GitHub", href: "https://github.com/someone" },
    { label: "Email", href: "mailto:someone@example.com" },
  ],
  intro: {
    paragraphs: ["Hey, I'm Test.", "Second paragraph."],
  },
  education: {
    school: "Test University",
    degree: "B.S. Testing",
    gpaLabel: "Technical GPA",
    gpa: "3.9",
  },
  experience: [
    { title: "Engineer", company: "Acme" },
    { title: "Intern", company: "Globex" },
  ],
  projects: [{ name: "Alpha" }, { name: "Beta" }],
  research: [
    { title: "Paper One", role: "Lead author" },
    { title: "Paper Two", role: "Assistant" },
  ],
  coursework: [
    { code: "CS 101", name: "Intro", grade: "A" },
    { code: "MATH 2210", name: "Linear Algebra", grade: "in progress" },
  ],
  contact: [
    { label: "Email", value: "someone@example.com" },
    { label: "LinkedIn", value: "https://www.linkedin.com/in/someone/" },
    { label: "GitHub", value: "https://github.com/someone" },
  ],
};
