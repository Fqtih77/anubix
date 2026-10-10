"use client";

import Image from "next/image";
import { type CSSProperties, useEffect } from "react";
import { type Project, STATUS_LABEL } from "@/data/projects";
import { ProjectCover } from "./ProjectCover";
import styles from "./ProjectShowcase.module.css";

interface Props {
  projects: Project[];
  projectId: string;
  onSwitch: (id: string) => void;
  onClose: () => void;
}

const nn = (n: number) => String(n).padStart(2, "0");

/** Oyun seçme ekranı havasında proje tanıtımı. */
export function ProjectShowcase({ projects, projectId, onSwitch, onClose }: Props) {
  const index = Math.max(
    0,
    projects.findIndex((p) => p.id === projectId),
  );
  const project = projects[index];
  const placeholder = project.status === "placeholder";

  useEffect(() => {
    const go = (delta: number) => onSwitch(projects[(index + delta + projects.length) % projects.length].id);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        go(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        go(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, projects, onSwitch]);

  const go = (delta: number) => onSwitch(projects[(index + delta + projects.length) % projects.length].id);
  const style = { "--accent": project.accent, "--accent2": project.accent2 } as CSSProperties;

  return (
    <div className={styles.screen} style={style}>
      <div className={styles.bg} aria-hidden="true" />
      <header className={styles.top}>
        <button type="button" className={styles.back} onClick={onClose}>
          <span aria-hidden="true">←</span> Odaya dön <kbd>Esc</kbd>
        </button>
        <p className={styles.counter}>
          PROJE {nn(index + 1)} / {nn(projects.length)}
        </p>
        <div className={styles.arrows}>
          <button type="button" aria-label="Önceki proje" onClick={() => go(-1)}>
            ‹
          </button>
          <button type="button" aria-label="Sonraki proje" onClick={() => go(1)}>
            ›
          </button>
        </div>
      </header>

      <article key={project.id} className={styles.main} aria-labelledby="showcase-title">
        <div className={styles.coverWrap}>
          <div className={styles.disc} aria-hidden="true" />
          <div className={styles.cover}>
            {project.image ? (
              <Image src={project.image.src} alt={project.image.alt} fill sizes="(max-width: 760px) 80vw, 420px" />
            ) : (
              <ProjectCover project={project} className={styles.coverArt} />
            )}
          </div>
        </div>

        <div className={styles.info}>
          <p className={styles.badge} data-status={project.status}>
            {STATUS_LABEL[project.status]}
          </p>
          <h2 id="showcase-title" className={styles.title}>
            {project.title}
          </h2>
          <p className={styles.tagline}>
            {project.tagline}
            {project.period ? <span> · {project.period}</span> : null}
          </p>
          <p className={styles.desc}>{project.summary}</p>
          <p className={styles.desc}>{project.description}</p>

          <div className={styles.lists}>
            {project.done.length > 0 ? (
              <section>
                <h3>Şu an var olan</h3>
                <ul>
                  {project.done.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}
            {project.planned.length > 0 ? (
              <section>
                <h3>{placeholder ? "Eklenecek bilgiler" : "Planlanan (henüz yok)"}</h3>
                <ul data-planned="true">
                  {project.planned.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          {project.tech.length > 0 ? (
            <ul className={styles.tags} aria-label="Teknolojiler">
              {project.tech.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          ) : null}

          <div className={styles.links}>
            {project.links.github ? (
              <a href={project.links.github} target="_blank" rel="noreferrer" className={styles.primary}>
                GitHub&apos;da incele <span aria-hidden="true">↗</span>
              </a>
            ) : (
              <span className={styles.muted}>GitHub bağlantısı eklenecek</span>
            )}
            {project.links.live ? (
              <a href={project.links.live} target="_blank" rel="noreferrer" className={styles.secondary}>
                Canlı demo <span aria-hidden="true">↗</span>
              </a>
            ) : (
              <span className={styles.muted}>{project.liveNote ?? "Canlı demo bağlantısı yok"}</span>
            )}
          </div>
        </div>
      </article>

      <footer className={styles.library}>
        <p className={styles.libraryTitle}>Kütüphane</p>
        <ul>
          {projects.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
                aria-current={p.id === project.id ? "true" : undefined}
                aria-label={`${p.title}${p.status === "placeholder" ? " (örnek proje)" : ""}`}
                onClick={() => onSwitch(p.id)}
                style={{ "--slot": p.accent } as CSSProperties}
              >
                {nn(i + 1)}
              </button>
            </li>
          ))}
        </ul>
        <p className={styles.hint}>
          <kbd>←</kbd> <kbd>→</kbd> proje değiştir · <kbd>Esc</kbd> odaya dön
        </p>
      </footer>
    </div>
  );
}
