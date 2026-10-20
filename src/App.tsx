import Hero from "./Hero";
import { driveUrl, education, experience, person, services, skills, tools, works } from "./data";

export default function App() {
  return (
    <>
      <a className="skiplink" href="#main">Skip to content</a>
      <div id="top" />
      <Hero />
      <main id="main">
        <section id="about" className="about">
          <img src={person.portrait} alt={`Portrait of ${person.name}`} width={335} height={498} />
          <div>
            <h2>About</h2>
            <p className="big">{person.summary}</p>
            <dl className="facts">
              <div><dt>Experience</dt><dd>5+ years</dd></div>
              <div><dt>Based in</dt><dd>{person.location}</dd></div>
              <div><dt>Education</dt><dd>{education.degree}, {education.school} ({education.period})</dd></div>
            </dl>
          </div>
        </section>

        <section id="work">
          <div className="head">
            <h2>Creatives</h2>
            <a href={driveUrl} target="_blank" rel="noreferrer">Full Drive folder ↗</a>
          </div>
          <ul className="grid">
            {works.map((w) => (
              <li key={w.title}>
                <a href={w.href} target="_blank" rel="noreferrer">
                  <img src={w.cover} alt="" loading="lazy" className={w.wide ? "wide" : undefined} />
                  <strong>{w.title}</strong>
                  <span>{w.category} · {w.client} · {w.year}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2>What I do</h2>
          <ol className="services">
            {services.map((s) => (
              <li key={s.title}>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="experience">
          <h2>Experience</h2>
          <ol className="timeline">
            {experience.map((x) => (
              <li key={x.org}>
                <p className="period">{x.period}</p>
                <div>
                  <h3>{x.role}</h3>
                  <p className="org">{x.org}</p>
                  <ul>{x.points.map((p) => <li key={p}>{p}</li>)}</ul>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="stack">
          <div>
            <h2>Skills</h2>
            <ul className="tags">{skills.map((s) => <li key={s}>{s}</li>)}</ul>
          </div>
          <div>
            <h2>Tools</h2>
            <ul className="tags">{tools.map((s) => <li key={s}>{s}</li>)}</ul>
          </div>
        </section>

        <section id="contact" className="contact">
          <h2>Have a story to cut?</h2>
          <a className="mail" href={`mailto:${person.email}`}>{person.email}</a>
          <p>
            <a href={`tel:${person.phone.replace(/\s/g, "")}`}>{person.phone}</a> · {person.location} ·{" "}
            <a href="resume.pdf" target="_blank" rel="noreferrer">Resume (PDF)</a>
          </p>
        </section>
      </main>
      <footer>© {new Date().getFullYear()} {person.name}</footer>
    </>
  );
}
