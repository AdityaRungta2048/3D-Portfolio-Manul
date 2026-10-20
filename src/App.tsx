import { motion, MotionConfig } from "framer-motion";
import type { ReactNode } from "react";
import Hero from "./Hero";
import skyImg from "./assets/sky.webp";
import cloudsImg from "./assets/clouds.webp";
import { driveUrl, education, experience, person, services, skills, tools, works } from "./data";

const stats = [
  { value: "5+", label: "Years editing" },
  { value: String(experience.length), label: "Studios & brands" },
  { value: String(skills.length), label: "Core skills" },
  { value: String(tools.length), label: "Tools in the stack" },
];

const banners = works.filter((w) => w.wide);
const posts = works.filter((w) => !w.wide);

/** Fades a block up as it scrolls into view. */
function Reveal({ children, delay = 0, className, li }: { children: ReactNode; delay?: number; className?: string; li?: boolean }) {
  const Tag = li ? motion.li : motion.div;
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, delay, ease: [0.2, 0.7, 0.2, 1] }}
    >
      {children}
    </Tag>
  );
}

function Heading({ index, label, children }: { index: string; label: string; children: ReactNode }) {
  return (
    <Reveal className="sec-head">
      <p className="eyebrow"><span>{index}</span> {label}</p>
      <h2>{children}</h2>
    </Reveal>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <a className="skiplink" href="#main">Skip to content</a>
      <div id="top" />
      <Hero />

      <div className="marquee" aria-hidden>
        <div className="marquee-track">
          {[0, 1].map((n) => (
            <span key={n}>
              {skills.map((s) => (
                <span key={s}>{s}<i /></span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <main id="main">
        <section id="about" className="about">
          <Reveal className="portrait">
            <div className="portrait-sky" style={{ backgroundImage: `url(${skyImg})` }} />
            <img src={person.portrait} alt={`Portrait of ${person.name}`} width={335} height={498} />
            <span className="badge">● Based in {person.location.split(",")[0]}</span>
          </Reveal>
          <div>
            <Heading index="01" label="About">
              I turn raw footage into stories people <em>feel</em>.
            </Heading>
            <Reveal delay={0.1}>
              <p className="big">{person.summary}</p>
            </Reveal>
            <Reveal delay={0.2} className="stats">
              {stats.map((s) => (
                <div key={s.label}>
                  <strong>{s.value}</strong>
                  <span>{s.label}</span>
                </div>
              ))}
            </Reveal>
            <Reveal delay={0.25}>
              <p className="edu">
                {education.degree} · {education.school} · {education.period}
              </p>
            </Reveal>
          </div>
        </section>

        <section id="work" className="work">
          <div className="inner">
            <div className="work-head">
              <Heading index="02" label="Creatives">
                Campaign work for <em>Sanskriti University</em>.
              </Heading>
              <Reveal delay={0.1}>
                <a className="pill light" href={driveUrl} target="_blank" rel="noreferrer">Full Drive folder ↗</a>
              </Reveal>
            </div>

            <div className="banners">
              {banners.map((w, i) => (
                <Reveal key={w.title} delay={i * 0.06}>
                  <a className="tile" href={w.href} target="_blank" rel="noreferrer">
                    <img src={w.cover} alt="" loading="lazy" />
                    <span className="tile-cap"><strong>{w.title}</strong>{w.category} · {w.year}</span>
                  </a>
                </Reveal>
              ))}
            </div>

            <div className="posts">
              {posts.map((w, i) => (
                <Reveal key={w.title} delay={i * 0.06}>
                  <a className="tile" href={w.href} target="_blank" rel="noreferrer">
                    <img src={w.cover} alt="" loading="lazy" />
                    <span className="tile-cap"><strong>{w.title}</strong>{w.category} · {w.year}</span>
                  </a>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="services">
          <Heading index="03" label="What I do">
            Cut, colour, motion and <em>sound</em>.
          </Heading>
          <ol>
            {services.map((s, i) => (
              <Reveal li key={s.title} delay={(i % 3) * 0.08}>
                <span className="num">{String(i + 1).padStart(2, "0")}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </Reveal>
            ))}
          </ol>
        </section>

        <section id="experience" className="experience">
          <Heading index="04" label="Experience">
            Five years across <em>studios and brands</em>.
          </Heading>
          <ol className="timeline">
            {experience.map((x, i) => (
              <Reveal li key={x.org} delay={0.05} className={i === 0 ? "now" : undefined}>
                <span className="dot" aria-hidden />
                <p className="period">{x.period}{i === 0 && <span className="live">Now</span>}</p>
                <div className="role">
                  <h3>{x.role}</h3>
                  <p className="org">{x.org}</p>
                  <ul>{x.points.map((p) => <li key={p}>{p}</li>)}</ul>
                </div>
              </Reveal>
            ))}
          </ol>
        </section>

        <section className="stack">
          <Reveal className="stack-card">
            <p className="eyebrow"><span>05</span> Skills</p>
            <ul className="tags">{skills.map((s) => <li key={s}>{s}</li>)}</ul>
          </Reveal>
          <Reveal className="stack-card" delay={0.1}>
            <p className="eyebrow"><span>06</span> Tools</p>
            <ul className="tags">{tools.map((s) => <li key={s}>{s}</li>)}</ul>
          </Reveal>
        </section>

        <section id="contact" className="contact">
          <Reveal className="contact-panel">
            <img className="contact-sky" src={skyImg} alt="" />
            <img className="contact-clouds" src={cloudsImg} alt="" />
            <div className="contact-body">
              <p className="eyebrow light"><span>07</span> Contact</p>
              <h2>Have a story <em>to cut?</em></h2>
              <a className="cta" href={`mailto:${person.email}`}>{person.email} →</a>
              <p className="contact-meta">
                <a href={`tel:${person.phone.replace(/\s/g, "")}`}>{person.phone}</a>
                <span>{person.location}</span>
                <a href="resume.pdf" target="_blank" rel="noreferrer">Resume (PDF)</a>
              </p>
            </div>
          </Reveal>
        </section>
      </main>

      <footer>
        <span>© {new Date().getFullYear()} {person.name}</span>
        <a href="#top">Back to top ↑</a>
      </footer>
    </MotionConfig>
  );
}
