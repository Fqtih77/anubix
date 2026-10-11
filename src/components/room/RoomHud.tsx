import Link from "next/link";
import { memo } from "react";
import { REGIONS, type RegionId } from "./layout";
import styles from "./RoomHud.module.css";
import type { Activity } from "./roomStore";

interface HudProps {
  regionIndex: number;
  onRegion: (index: number) => void;
  status: string;
  running: boolean;
  onSkip: () => void;
  activity: Activity;
  onReturn: () => void;
  reduced: boolean;
  onToggleMotion: () => void;
  showExploreHint: boolean;
}

/** Odanın üst çubuğu ve alt gezinmesi. */
function RoomHudImpl({
  regionIndex,
  onRegion,
  status,
  running,
  onSkip,
  activity,
  onReturn,
  reduced,
  onToggleMotion,
  showExploreHint,
}: HudProps) {
  const busy = running || activity !== "desk";
  return (
    <>
      <header className={styles.topbar}>
        <Link href="/" className={styles.brand} aria-label="Anubix ana sayfa">
          anubix<span>.</span>
        </Link>
        <span className={styles.chip}>v0.4 · anubix dünyası</span>
        <nav className={styles.tools} aria-label="Sayfa araçları">
          <a href="#hizli-bakis" className={styles.tool}>
            Hızlı liste
          </a>
          <button type="button" className={styles.tool} aria-pressed={reduced} onClick={onToggleMotion}>
            <span aria-hidden="true">{reduced ? "◼" : "▶"}</span> Hareket: {reduced ? "azaltılmış" : "açık"}
          </button>
          <a href="https://github.com/Fqtih77/anubix" target="_blank" rel="noreferrer" className={styles.tool}>
            GitHub <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>

      <div className={styles.bottom}>
        <div className={styles.left} aria-live="polite" aria-atomic="true">
          {busy ? (
            <div className={styles.busy}>
              <span className={styles.status}>{status || (activity === "gaming" ? "Mola modu" : "Dinlenme")}</span>
              {running ? (
                <button type="button" className={styles.primary} onClick={onSkip}>Animasyonu atla</button>
              ) : (
                <button type="button" className={styles.primary} onClick={onReturn}>Masaya dön</button>
              )}
            </div>
          ) : showExploreHint ? (
            <p className={styles.explore}>
              <span aria-hidden="true">✦</span> Odayı keşfet: kaydır ya da parlayan nesnelere tıkla
            </p>
          ) : null}
        </div>

        <nav className={styles.regions} aria-label="Oda bölgeleri">
          <ul>
            {REGIONS.map((r, i) => (
              <li key={r.id}>
                <button
                  type="button"
                  className={styles.region}
                  aria-current={i === regionIndex ? "true" : undefined}
                  onClick={() => onRegion(i)}
                >
                  <RegionIcon id={r.id} />
                  <span>{r.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}

export const RoomHud = memo(RoomHudImpl);

/** Bölge düğmeleri için küçük piksel simgeler. */
function RegionIcon({ id }: { id: RegionId }) {
  const paths: Record<RegionId, string> = {
    desk: "M2 6h12v2H2zM3 8h2v5H3zM11 8h2v5h-2zM5 2h6v3H5z",
    records: "M1 1h14v14H1zM2.5 2.5v11h11v-11zM6 4h4l2 2v4l-2 2H6L4 10V6zM7 7v2h2V7z",
    tv: "M2 2h12v8H2zM6 11h4v1.5H6zM4 13h8v1.5H4z",
    bed: "M1 7h14v4H1zM1 4h2v3H1zM4 5h4v2H4zM1 11h2v2H1zM13 11h2v2h-2z",
    room: "M8 1l7 4v6l-7 4-7-4V5zM8 3L3 6l5 3 5-3z",
  };
  return (
    <svg className={styles.icon} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d={paths[id]} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}
