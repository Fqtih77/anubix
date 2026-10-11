import { type CSSProperties, memo } from "react";
import { type Project, STATUS_LABEL } from "@/data/projects";
import styles from "./QuickLook.module.css";

interface Props {
  projects: Project[];
  onOpenProject: (id: string) => void;
  onBackToRoom: () => void;
}

/**
 * Animasyonsuz hızlı bakış: odadaki her şeye düz bir listeden ulaşılır.
 * Düşük performanslı cihazlar, ekran okuyucular ve aceleci ziyaretçiler için.
 */
function QuickLookImpl({ projects, onOpenProject, onBackToRoom }: Props) {
  return (
    <section id="hizli-bakis" className={styles.quick} aria-labelledby="quick-title">
      <div className={styles.inner}>
        <p className={styles.eyebrow}>Animasyonsuz hızlı bakış</p>
        <h2 id="quick-title" className={styles.heading}>
          Odadaki her şey, tek listede
        </h2>
        <p className={styles.lead}>
          Anubix dijital çalışma odam. Projelerim raflarda duruyor; buradan tanıtımlarına hızlıca ulaşabilirsin.
        </p>

        <ul className={styles.projects}>
          {projects.map((p, i) => (
            <li key={p.id} className={styles.project} style={{ "--accent": p.accent } as CSSProperties}>
              <div className={styles.projectTop}>
                <span className={styles.index}>{String(i + 1).padStart(2, "0")}</span>
                <span className={styles.badge} data-status={p.status}>
                  {STATUS_LABEL[p.status]}
                </span>
              </div>
              <h3 className={styles.projectTitle}>{p.title}</h3>
              <p className={styles.tagline}>{p.tagline}</p>
              <p className={styles.summary}>{p.summary}</p>
              {p.tech.length > 0 ? (
                <ul className={styles.tags} aria-label="Teknolojiler">
                  {p.tech.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              ) : null}
              <div className={styles.actions}>
                <button type="button" className={styles.open} onClick={() => onOpenProject(p.id)}>
                  Tanıtımı aç
                </button>
                {p.links.github ? (
                  <a href={p.links.github} target="_blank" rel="noreferrer" className={styles.link}>
                    GitHub <span aria-hidden="true">↗</span>
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ul>

        <footer className={styles.footer}>
          <span>© 2026 Anubix · MIT lisansı</span>
          <a href="https://github.com/Fqtih77/anubix" target="_blank" rel="noreferrer">
            Kaynak kodu GitHub&apos;da
          </a>
          <button type="button" className={styles.backTop} onClick={onBackToRoom}>
            Odaya dön ↑
          </button>
        </footer>
      </div>
    </section>
  );
}

export const QuickLook = memo(QuickLookImpl);
