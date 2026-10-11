import { type CSSProperties, memo } from "react";
import { cv } from "@/data/cv";
import { type Project, STATUS_LABEL } from "@/data/projects";
import styles from "./QuickLook.module.css";

interface Props {
  projects: Project[];
  onOpenProject: (id: string) => void;
  onOpenCv: () => void;
  onBackToRoom: () => void;
}

/**
 * Animasyonsuz hızlı bakış: odadaki her şeye düz bir listeden ulaşılır.
 * Düşük performanslı cihazlar, ekran okuyucular ve aceleci ziyaretçiler için.
 */
function QuickLookImpl({ projects, onOpenProject, onOpenCv, onBackToRoom }: Props) {
  return (
    <section id="hizli-bakis" className={styles.quick} aria-labelledby="quick-title">
      <div className={styles.inner}>
        <p className={styles.eyebrow}>Animasyonsuz hızlı bakış</p>
        <h2 id="quick-title" className={styles.heading}>
          Odadaki her şey, tek listede
        </h2>
        <p className={styles.lead}>
          Anubix dijital çalışma odam. Duvardaki plaklardan biri CV&apos;mi, diğeri projelerimi bilgisayarda açıyor;
          buradan ikisine de hızlıca ulaşabilirsin.
        </p>

        <section className={styles.cvCard} aria-labelledby="quick-cv-title">
          <span className={styles.cvDisc} aria-hidden="true">
            CV
          </span>
          <div className={styles.cvText}>
            <h3 id="quick-cv-title" className={styles.cvName}>
              {cv.name}
            </h3>
            <p className={styles.cvHeadline}>{cv.headline}</p>
          </div>
          <div className={styles.cvActions}>
            <button type="button" className={styles.open} onClick={onOpenCv}>
              CV&apos;yi aç
            </button>
            <a href={cv.pdf} download className={styles.link}>
              PDF indir <span aria-hidden="true">↓</span>
            </a>
          </div>
        </section>

        <h3 className={styles.subheading}>Projeler</h3>
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
