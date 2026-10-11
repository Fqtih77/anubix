"use client";

import { Old_Standard_TT } from "next/font/google";
import { Fragment, type ReactNode } from "react";
import { type CvEntry, type CvSkill, cv } from "@/data/cv";
import { seeded } from "@/lib/iso";
import styles from "./CvScreen.module.css";

/**
 * ÖZGEÇMİŞ EKRANI
 * ---------------
 * CV plağı bilgisayara takılınca açılır. Arka plan oyun teması değil: bir iş merkezinin
 * 50. katındaki toplantı odası. Ortada, kaydırılabilen bir kâğıtta CV, LaTeX çıktısıyla
 * (Jake's Resume) aynı düzende durur. İçerik `src/data/cv.ts` dosyasından gelir.
 */

// LaTeX'in Computer Modern yazısına en yakın serif; yalnızca bu ekran açılınca yüklenir.
const cvFont = Old_Standard_TT({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-cv",
  display: "swap",
  preload: false,
});

export function CvScreen({ onClose }: { onClose: () => void }) {
  return (
    <div className={styles.screen}>
      <InterviewBackdrop />

      <header className={styles.top}>
        <button type="button" className={styles.back} onClick={onClose}>
          <span aria-hidden="true">←</span> Odaya dön <kbd>Esc</kbd>
        </button>
        <p className={styles.floor}>
          <span aria-hidden="true">50</span> Toplantı odası
        </p>
        <a className={styles.download} href={cv.pdf} download>
          PDF indir <span aria-hidden="true">↓</span>
        </a>
      </header>

      {/* biome-ignore lint/a11y/noNoninteractiveTabindex: kaydırılabilen alan klavyeyle de kaydırılabilsin */}
      <article className={`${styles.paper} ${cvFont.variable}`} tabIndex={0} aria-label={`Özgeçmiş: ${cv.name}`}>
        <CvDocument />
      </article>
    </div>
  );
}

/* ---------- CV belgesi (Jake's Resume düzeni) ---------- */

/** "**kalın**" işaretlerini <strong> yapar. */
function rich(text: string): ReactNode {
  return text.split("**").map((part, i) =>
    i % 2 === 1 ? (
      // biome-ignore lint/suspicious/noArrayIndexKey: parçaların sırası sabit
      <strong key={i}>{part}</strong>
    ) : (
      // biome-ignore lint/suspicious/noArrayIndexKey: parçaların sırası sabit
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      {children}
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ul className={styles.bullets}>
      {items.map((item) => (
        <li key={item}>{rich(item)}</li>
      ))}
    </ul>
  );
}

function Entry({ entry }: { entry: CvEntry }) {
  return (
    <div className={styles.entry}>
      <div className={styles.row}>
        <strong>{entry.title}</strong>
        <span>{entry.right}</span>
      </div>
      <div className={`${styles.row} ${styles.sub}`}>
        <em className={styles.accent}>{entry.subtitle}</em>
        <em className={styles.muted}>{entry.subtitleRight}</em>
      </div>
      <Bullets items={entry.bullets} />
    </div>
  );
}

/** Becerileri satırlara böler (`sameLine` olanlar bir öncekinin yanına). */
const SKILL_LINES = cv.skills.reduce<CvSkill[][]>((lines, skill) => {
  const last = lines.at(-1);
  if (skill.sameLine && last) last.push(skill);
  else lines.push([skill]);
  return lines;
}, []);

function CvDocument() {
  return (
    <div className={styles.doc}>
      <header className={styles.head}>
        <h2 className={styles.name}>{cv.name}</h2>
        <p className={styles.headline}>{cv.headline}</p>
        <p className={styles.contact}>
          {cv.contact.map((c, i) => (
            <Fragment key={c.label}>
              {i > 0 ? <span className={styles.sep}> | </span> : null}
              {c.href ? (
                <a href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                  {c.label}
                </a>
              ) : (
                <span>{c.label}</span>
              )}
            </Fragment>
          ))}
        </p>
      </header>

      <Section title="Özet">
        <p className={styles.small}>{cv.summary}</p>
      </Section>

      <Section title="Eğitim">
        {cv.education.map((e) => (
          <Entry key={e.title} entry={e} />
        ))}
      </Section>

      <Section title="Deneyim">
        {cv.experience.map((e) => (
          <Entry key={e.title} entry={e} />
        ))}
      </Section>

      <Section title="Projeler">
        {cv.projects.map((p) => (
          <div key={p.name} className={styles.entry}>
            <div className={`${styles.row} ${styles.small}`}>
              <span>
                <strong>{p.name}</strong>
                {p.link ? (
                  <>
                    {" — "}
                    <a href={p.link.href} target="_blank" rel="noreferrer">
                      {p.link.label}
                    </a>
                  </>
                ) : null}
                <span className={styles.sep}> | </span>
                <em className={styles.accent}>{p.tech}</em>
              </span>
              <span>{p.date}</span>
            </div>
            <Bullets items={p.bullets} />
          </div>
        ))}
      </Section>

      <Section title="Başarılar ve Burslar">
        {cv.achievements.map((a) => (
          <div key={a.title} className={`${styles.row} ${styles.small} ${styles.line}`}>
            <span>
              <strong>{a.title}</strong>
              <span className={styles.sep}> | </span>
              <em className={styles.muted}>{a.detail}</em>
            </span>
            <span>{a.date}</span>
          </div>
        ))}
      </Section>

      <Section title="Teknik Beceriler">
        <p className={`${styles.small} ${styles.skills}`}>
          {SKILL_LINES.map((line) => (
            <span key={line[0].label}>
              {line.map((s, i) => (
                <Fragment key={s.label}>
                  {i > 0 ? <span className={styles.quad} /> : null}
                  <strong className={styles.accent}>{s.label}</strong>: {s.value}
                </Fragment>
              ))}
            </span>
          ))}
        </p>
      </Section>
    </div>
  );
}

/* ---------- 50. kattaki toplantı odası ---------- */

const W = 1600;
const H = 900;
const HORIZON = 470;
const SILL = 760;

interface Tower {
  x: number;
  w: number;
  top: number;
}

/** Sabit tohumla üretilmiş şehir: her açılışta aynı manzara. */
function makeCity(seed: number, count: number, minTop: number, maxTop: number): Tower[] {
  const rand = seeded(seed);
  return Array.from({ length: count }, (_, i) => ({
    x: (i / count) * W - 30 + rand() * 40,
    w: 60 + rand() * 90,
    top: minTop + rand() * (maxTop - minTop),
  }));
}

const FAR = makeCity(7, 22, 380, 470);
const MID = makeCity(19, 14, 470, 600);
const TALL = [
  { x: 60, w: 130, top: 170 },
  { x: 250, w: 90, top: 260 },
  { x: 1270, w: 110, top: 210 },
  { x: 1430, w: 140, top: 150 },
];

function Windows({ t, color, every }: { t: Tower; color: string; every: number }) {
  const rows: ReactNode[] = [];
  const rand = seeded(Math.round(t.x * 13 + t.top));
  for (let y = t.top + 14; y < SILL - 10; y += 18) {
    for (let x = t.x + 10; x < t.x + t.w - 12; x += 16) {
      if (rand() < every) rows.push(<rect key={`${x}-${y}`} x={x} y={y} width={7} height={9} fill={color} />);
    }
  }
  return <g>{rows}</g>;
}

function InterviewBackdrop() {
  return (
    <svg className={styles.backdrop} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="cv-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7fa9d9" />
          <stop offset="0.55" stopColor="#c9d4e6" />
          <stop offset="0.75" stopColor="#f0d2b6" />
          <stop offset="1" stopColor="#e9b896" />
        </linearGradient>
        <linearGradient id="cv-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b3e48" />
          <stop offset="1" stopColor="#24262d" />
        </linearGradient>
        <linearGradient id="cv-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.16" />
          <stop offset="0.4" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="cv-table" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6b4a36" />
          <stop offset="1" stopColor="#3d2a20" />
        </linearGradient>
      </defs>

      {/* Gökyüzü ve şehir */}
      <rect width={W} height={SILL} fill="url(#cv-sky)" />
      <circle cx={1180} cy={HORIZON - 40} r={46} fill="#fff1d9" opacity={0.7} />
      {FAR.map((t) => (
        <rect key={`f${t.x}`} x={t.x} y={t.top} width={t.w} height={SILL - t.top} fill="#a8b6cb" />
      ))}
      <rect x={0} y={HORIZON - 10} width={W} height={60} fill="#e9d8ca" opacity={0.35} />
      {MID.map((t) => (
        <g key={`m${t.x}`}>
          <rect x={t.x} y={t.top} width={t.w} height={SILL - t.top} fill="#77869f" />
          <Windows t={t} color="#ffe7b0" every={0.18} />
        </g>
      ))}
      {TALL.map((t) => (
        <g key={`t${t.x}`}>
          <rect x={t.x} y={t.top} width={t.w} height={SILL - t.top} fill="#4b566b" />
          <rect x={t.x + t.w / 2 - 2} y={t.top - 34} width={4} height={34} fill="#4b566b" />
          <circle className={styles.beacon} cx={t.x + t.w / 2} cy={t.top - 36} r={4} fill="#ff6b5e" />
          <Windows t={t} color="#ffeec7" every={0.22} />
        </g>
      ))}

      {/* Cam cephe: kayıtlar ve yansıma */}
      <rect width={W} height={SILL} fill="url(#cv-glass)" />
      {[0, 400, 800, 1200, 1600].map((x) => (
        <rect key={x} x={x - 9} y={0} width={18} height={SILL} fill="#1f222a" />
      ))}
      <rect x={0} y={118} width={W} height={10} fill="#1f222a" />

      {/* Tavan ve aydınlatma */}
      <rect width={W} height={96} fill="#1b1d23" />
      {[200, 600, 1000, 1400].map((x) => (
        <rect key={x} x={x - 120} y={70} width={240} height={8} rx={4} fill="#fff6e3" opacity={0.85} />
      ))}

      {/* Zemin, saksı ve masa */}
      <rect y={SILL} width={W} height={H - SILL} fill="url(#cv-floor)" />
      <rect y={SILL} width={W} height={6} fill="#54586a" />
      <g transform="translate(110 640)">
        <path d="M-30,120 L-24,40 H24 L30,120 Z" fill="#e8e3da" />
        <ellipse cx={-20} cy={10} rx={26} ry={62} fill="#3f7d4f" transform="rotate(-18 -20 10)" />
        <ellipse cx={18} cy={0} rx={24} ry={70} fill="#4f9461" transform="rotate(14 18 0)" />
        <ellipse cx={0} cy={-20} rx={20} ry={64} fill="#5aa86e" />
      </g>
      <path d={`M120,${H} L260,800 H1340 L1480,${H} Z`} fill="url(#cv-table)" />
      <path d="M260,800 H1340 L1352,812 H248 Z" fill="#8a6247" />
      {/* Masadaki küçük ayrıntılar */}
      <rect x={1240} y={818} width={26} height={40} rx={4} fill="#d8eef8" opacity={0.7} />
      <rect x={300} y={822} width={120} height={14} rx={3} fill="#efe9df" transform="rotate(-4 360 829)" />
    </svg>
  );
}
