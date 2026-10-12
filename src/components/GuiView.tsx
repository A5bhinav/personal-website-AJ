import { content } from "../content";

function Section({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section className="tp-section">
      <div className="tp-section-title">{title}</div>
      <ul className="tp-list">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export function GuiView() {
  const { site, guiLinks, intro, experience, projects, research, coursework } = content;
  return (
    <>
      <h1 className="tp-name">{site.fullName}</h1>
      <nav className="tp-links">
        {guiLinks.map((link) => {
          const external = link.href.startsWith("http");
          return (
            <a
              key={link.label}
              className="tp-link"
              href={link.href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
            >
              {link.label}
            </a>
          );
        })}
      </nav>
      <hr className="tp-hr tp-hr--accent" />
      <div className="tp-intro">
        {intro.paragraphs.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>
      <hr className="tp-hr" />
      <Section title="EXPERIENCE" items={experience.map((e) => `${e.title} @ ${e.company}`)} />
      <Section title="PROJECTS" items={projects.map((p) => p.name)} />
      <Section title="RESEARCH" items={research.map((r) => `${r.title} (${r.role})`)} />
      <Section title="COURSEWORK" items={coursework.map((c) => `${c.code} — ${c.name} (${c.grade})`)} />
      <hr className="tp-hr tp-hr--accent" />
      <footer className="tp-footer">
        © {new Date().getFullYear()} {site.fullName}
      </footer>
    </>
  );
}
