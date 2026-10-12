// ALL personal content + site config lives here. Every virtual file (src/fs.ts)
// and every piece of UI is derived from this object, so this is the only file
// to edit when the content changes.

export type Experience = { title: string; company: string };
export type Project = { name: string; description?: string; url?: string; tech?: string[] }; // only `name` is used in the core build
export type Research = { title: string; role: string };
export type Course = { name: string; code?: string; grade?: string }; // grade may be "in progress"; code and grade are left out of the page when absent
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
    tabTitle: "Abhinav Jinka", // <title> of the page
    fullName: "Abhinav Jinka", // GUI heading + footer
    firstName: "Abhinav", // "Welcome to {firstName}'s terminal!"
    promptUser: "guest@abhinavjinka", // left part of every prompt line
  },
  welcome: {
    title: "abhinavjinka.sh", // boxed panel title
    version: "v0.1.0", // shown muted after the title
    metaLine: "zsh · guest session", // first line of the bottom-left meta
    cwdLabel: "~/abhinavjinka", // second line of the meta
    commandNames: ["help"], // commands that open the panel
  },
  guiLinks: [
    // row under the name in GUI mode
    { label: "GitHub", href: "https://github.com/A5bhinav" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/abhinavjinka/" },
    { label: "Email", href: "mailto:abhinavjinka@berkeley.edu" },
  ],
  intro: {
    paragraphs: [
      // first paragraph is a greeting, e.g. "Hey, I'm X."
      "Hey, I'm Abhinav.",
      "I'm an undergraduate at UC Berkeley studying Computer Science.",
      "I want to build a career in AI-adjacent roles or startups, working across the stack from fundamental machine learning to applied AI.",
      "My previous internship was at Northrop Grumman working for the Ground Verification team, and I'm currently recruiting for software engineering roles for Spring and Summer 2027.",
    ],
    cliParagraphs: undefined, // optional different wording for intro.txt; falls back to paragraphs
  },
  education: {
    school: "University of California, Berkeley",
    degree: "B.A. in Computer Science (Expected May 2028)",
    gpaLabel: "GPA",
    gpa: undefined, // no GPA line
  },
  experience: [
    { title: "Software Engineering Intern", company: "Northrop Grumman" },
    { title: "Technical Consultant", company: "IBM" },
    { title: "Data Science Extern", company: "Amazon" },
    { title: "Software Engineering Intern", company: "Sync Visual Media" },
    { title: "Software Engineering Intern", company: "Sundt Construction, Inc." },
  ],
  projects: [
    {
      name: "GEO Audit",
      description:
        "Built a GEO platform automating brand-visibility audits across 5 AI engines, sampling every query 5× through 8 LLM adapters",
      tech: ["Python", "FastAPI", "Anthropic/OpenAI/Gemini/Perplexity", "Supabase (PostgreSQL)", "Playwright", "Next.js", "Recharts"],
    },
    {
      name: "Live Grid Demand Forecaster",
      description:
        "Built a day-ahead CAISO electricity demand forecaster issuing immutable hourly forecasts and scoring them against actuals",
      tech: ["Python", "LightGBM", "PostgreSQL", "Supabase", "Next.js", "GitHub Actions", "Vercel", "EIA-930 API"],
    },
    {
      name: "Augur",
      description:
        "Built a privacy-first context layer for AI agents atop screenpipe's 24/7 OCR capture, ranking 1–2 GB of daily screen data on-device",
      tech: ["Python", "Screenpipe", "ChromaDB", "Sentence-transformers (MiniLM)", "MCP", "Chrome Extension (MV3)", "Anthropic/OpenAI"],
    },
    {
      name: "WorldCraft",
      description:
        "Processed 1K+ multimodal images with Hugging Face transformers to extract intrinsic, extrinsic, and semantic embeddings of images",
      tech: ["Python", "PyTorch", "NerfStudio", "Hugging Face Transformers", "NeRF", "Multimodal Embeddings", "Point Clouds"],
    },
  ],
  research: [], // none: hides the RESEARCH section and research.txt
  coursework: [
    { name: "Data Structures & Algorithms" },
    { name: "Discrete Math & Probability Theory" },
    { name: "Structure & Interpretation of Programs" },
    { name: "Great Ideas in Computer Architecture" },
    { name: "Intro to Machine Learning" },
    { name: "Linear Algebra & Differential Equations" },
    { name: "Multivariable Calculus" },
  ],
  contact: [
    // contact.txt rows, in order
    { label: "Email", value: "abhinavjinka@berkeley.edu" },
    { label: "LinkedIn", value: "https://www.linkedin.com/in/abhinavjinka/" },
    { label: "GitHub", value: "https://github.com/A5bhinav" },
  ],
};
