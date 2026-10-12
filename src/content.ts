// ALL personal content + site config lives here. Every virtual file (src/fs.ts)
// and every piece of UI is derived from this object, so filling in the TODO_
// placeholders is the only edit needed to make the site yours.

export type Experience = { title: string; company: string };
export type Project = { name: string; description?: string; url?: string; tech?: string[] }; // only `name` is used in the core build
export type Research = { title: string; role: string };
export type Course = { code: string; name: string; grade: string }; // grade may be "in progress"
export type ContactRow = { label: string; value: string }; // value may be an email or URL
export type NavLink = { label: string; href: string };

export type Content = {
  site: {
    tabTitle: string;
    fullName: string;
    firstName: string;
    promptUser: string;
  };
  welcome: {
    title: string;
    version: string;
    metaLine: string;
    cwdLabel: string;
    commandNames: string[];
  };
  guiLinks: NavLink[];
  intro: {
    paragraphs: string[];
    cliParagraphs?: string[];
  };
  education: {
    school: string;
    degree: string;
    gpaLabel: string;
    gpa?: string;
  };
  experience: Experience[];
  projects: Project[];
  research: Research[];
  coursework: Course[];
  contact: ContactRow[];
};

// Empty sections: an empty `experience`, `projects`, `research` or `coursework`
// array hides that GUI section and its virtual file (and any folder left empty).
export const content: Content = {
  site: {
    tabTitle: "TODO_TAB_TITLE", // <title> of the page
    fullName: "TODO_FULL_NAME", // GUI heading + footer
    firstName: "TODO_FIRST_NAME", // "Welcome to {firstName}'s terminal!"
    promptUser: "guest@TODO_HANDLE", // left part of every prompt line
  },
  welcome: {
    title: "TODO_PANEL_TITLE", // e.g. "yourname.sh" — boxed panel title
    version: "v0.1.0", // shown muted after the title
    metaLine: "zsh · guest session", // first line of the bottom-left meta
    cwdLabel: "~/TODO_HANDLE", // second line of the meta (indented)
    commandNames: ["help"], // commands that open the panel
  },
  guiLinks: [
    // row under the name in GUI mode
    { label: "GitHub", href: "https://github.com/TODO" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/TODO/" },
    { label: "Email", href: "mailto:TODO@example.com" },
  ],
  intro: {
    paragraphs: [
      // first paragraph is a greeting, e.g. "Hey, I'm X."
      "TODO_INTRO_GREETING",
      "TODO_INTRO_PARAGRAPH_2",
      "TODO_INTRO_PARAGRAPH_3",
    ],
    cliParagraphs: undefined, // optional different wording for intro.txt; falls back to paragraphs
  },
  education: {
    school: "TODO_SCHOOL",
    degree: "TODO_DEGREE",
    gpaLabel: "GPA", // e.g. "Technical GPA"
    gpa: "TODO_GPA", // set to undefined to omit the line
  },
  experience: [
    { title: "TODO_TITLE_1", company: "TODO_COMPANY_1" },
    { title: "TODO_TITLE_2", company: "TODO_COMPANY_2" },
    { title: "TODO_TITLE_3", company: "TODO_COMPANY_3" },
  ],
  projects: [
    { name: "TODO_PROJECT_1" },
    { name: "TODO_PROJECT_2" },
    { name: "TODO_PROJECT_3" },
  ],
  research: [
    { title: "TODO_RESEARCH_TITLE_1", role: "TODO_ROLE_1" },
    { title: "TODO_RESEARCH_TITLE_2", role: "TODO_ROLE_2" },
  ],
  coursework: [
    { code: "TODO 101", name: "TODO_COURSE_NAME_1", grade: "TODO_GRADE" },
    { code: "TODO 2020", name: "TODO_COURSE_2", grade: "TODO_GRADE" },
    { code: "TODO 303", name: "TODO_COURSE_NAME_THREE", grade: "in progress" },
  ],
  contact: [
    // contact.txt rows, in order
    { label: "Email", value: "TODO@example.com" },
    { label: "LinkedIn", value: "https://www.linkedin.com/in/TODO/" },
    { label: "GitHub", value: "https://github.com/TODO" },
  ],
};
