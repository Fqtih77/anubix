"use client";

import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { type Project, projectInitial } from "@/data/projects";
import { mix } from "@/lib/iso";
import { ProjectShowcase } from "./ProjectShowcase";
import styles from "./ProjectsDesktop.module.css";

/**
 * PROJE MASAÜSTÜ
 * --------------
 * "Projeler" plağı bilgisayara takılınca açılır: her proje bir klasör, üzerinde projenin
 * baş harfi, altında adı. Klasöre tıklanınca proje tanıtım ekranı klasörün yerinden
 * büyüyerek açılır; Esc ya da "Masaüstü" düğmesi masaüstüne döndürür.
 * Projeler kişisel paneldeki "Komut bloğu"ndan eklenir.
 */

interface Props {
  projects: Project[];
  /** Hızlı listeden gelindiyse doğrudan açık gelecek proje */
  initialProjectId: string | null;
  onClose: () => void;
  /** Dış diyalog Esc'e basılınca önce buraya sorar (açık proje varsa onu kapatır). */
  registerEscape: (handler: () => boolean) => void;
}

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  return now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

export function ProjectsDesktop({ projects, initialProjectId, onClose, registerEscape }: Props) {
  const [openId, setOpenId] = useState<string | null>(
    initialProjectId && projects.some((p) => p.id === initialProjectId) ? initialProjectId : null,
  );
  const [origin, setOrigin] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const icons = useRef(new Map<string, HTMLButtonElement>());
  const windowRef = useRef<HTMLDivElement>(null);
  const lastOpened = useRef<string | null>(openId);
  const clock = useClock();

  const openProject = (id: string, from: HTMLElement) => {
    const rect = from.getBoundingClientRect();
    setOrigin({
      x: ((rect.left + rect.width / 2) / window.innerWidth) * 100,
      y: ((rect.top + rect.height / 2) / window.innerHeight) * 100,
    });
    lastOpened.current = id;
    setOpenId(id);
  };

  const closeProject = useCallback(() => {
    setOpenId(null);
    // Odak, açılan klasöre geri dönsün.
    requestAnimationFrame(() => {
      if (lastOpened.current) icons.current.get(lastOpened.current)?.focus();
    });
  }, []);

  useEffect(() => {
    registerEscape(() => {
      if (!openId) return false;
      closeProject();
      return true;
    });
    return () => registerEscape(() => false);
  }, [openId, registerEscape, closeProject]);

  // Proje penceresi açılınca odak pencerenin içine geçsin.
  useEffect(() => {
    if (openId) windowRef.current?.querySelector<HTMLElement>("button")?.focus();
  }, [openId]);

  return (
    <div className={styles.desktop}>
      <div className={styles.wallpaper} aria-hidden="true" />

      <header className={styles.menubar}>
        <span className={styles.logo}>
          <span aria-hidden="true">◆</span> Anubix
        </span>
        <span className={styles.menuItem}>Projeler</span>
        <span className={styles.spacer} />
        <span className={styles.clock}>{clock}</span>
        <button type="button" className={styles.back} onClick={onClose}>
          <span aria-hidden="true">←</span> Odaya dön <kbd>Esc</kbd>
        </button>
      </header>

      <div className={styles.area} inert={openId !== null}>
        <h2 className={styles.title}>Projeler</h2>
        {projects.length === 0 ? (
          <p className={styles.empty}>Henüz proje yok. Kişisel paneldeki komut bloğundan ekleyebilirsin.</p>
        ) : (
          <ul className={styles.grid}>
            {projects.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  ref={(el) => {
                    if (el) icons.current.set(p.id, el);
                    else icons.current.delete(p.id);
                  }}
                  className={styles.folder}
                  aria-label={`${p.title} klasörünü aç`}
                  onClick={(event) => openProject(p.id, event.currentTarget)}
                >
                  <ProjectFolderIcon letter={projectInitial(p)} color={p.accent} />
                  <span className={styles.folderName}>{p.title}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className={styles.hint}>Bir klasöre tıkla · Esc odaya döndürür</p>
      </div>

      {openId ? (
        <div
          ref={windowRef}
          className={styles.window}
          style={{ "--ox": `${origin.x}%`, "--oy": `${origin.y}%` } as CSSProperties}
        >
          <ProjectShowcase
            projects={projects}
            projectId={openId}
            onSwitch={(id) => {
              lastOpened.current = id;
              setOpenId(id);
            }}
            onClose={closeProject}
            backLabel="Masaüstü"
          />
        </div>
      ) : null}
    </div>
  );
}

/** Rengi projeden gelen klasör; önünde projenin baş harfi. Paneldeki önizleme de bunu kullanır. */
export function ProjectFolderIcon({ letter, color }: { letter: string; color: string }) {
  const back = mix(color, "#1d1530", 0.28);
  return (
    <svg className={styles.folderSvg} viewBox="0 0 96 80" aria-hidden="true" focusable="false">
      <path d="M4,16 Q4,9 11,9 H33 Q37,9 40,12 L45,17 H85 Q92,17 92,24 V34 H4 Z" fill={back} />
      <rect x={4} y={24} width={88} height={52} rx={8} fill={color} />
      <rect x={4} y={24} width={88} height={16} rx={8} fill="#ffffff" opacity={0.22} />
      <text x={48} y={66} textAnchor="middle" className={styles.folderLetter}>
        {letter}
      </text>
    </svg>
  );
}
