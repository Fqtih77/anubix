"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { PanelFeature, PanelFeatureId } from "@/data/panelFeatures";
import { useMotionPreference } from "@/lib/useMotionPreference";
import { FeatureIcon } from "./FeatureIcon";
import { FeatureWindow } from "./FeatureWindow";
import { DueNotice } from "./DueNotice";
import styles from "./PanelExperience.module.css";
import { WorldMap } from "./WorldMap";

/**
 * KİŞİSEL PANEL
 * ------------------------
 * Önce kısa bir "dünya oluşturuluyor" geçişi oynar: ada blok blok kurulur.
 * Sonra her yapı oturumla korunan bir özelliği açar.
 */

const STAGES = [
  { at: 0, text: "Dünya oluşturuluyor…" },
  { at: 750, text: "Arazi şekillendiriliyor…" },
  { at: 1500, text: "Sandık ve komut bloğu yerleştiriliyor…" },
  { at: 2200, text: "Anubix dünyasına giriliyor…" },
];
const GENERATION_MS = 2900;

type Phase = "building" | "ready" | "instant";

export function PanelExperience({ features }: { features: PanelFeature[] }) {
  const { reduced, ready } = useMotionPreference();
  const [phase, setPhase] = useState<Phase>("building");
  const [stage, setStage] = useState(0);
  const [open, setOpen] = useState<PanelFeatureId | null>(null);
  const [hot, setHot] = useState<PanelFeatureId | null>(null);
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  const labels = useMemo(
    () => Object.fromEntries(features.map((f) => [f.id, f.title])) as Record<PanelFeatureId, string>,
    [features],
  );

  // Dünya oluşturma zaman çizelgesi. Hareket azaltıldıysa doğrudan hazır.
  useEffect(() => {
    if (!ready) return;
    if (reduced) {
      setPhase("instant");
      return;
    }
    const timers = STAGES.slice(1).map((s, i) => window.setTimeout(() => setStage(i + 1), s.at));
    timers.push(window.setTimeout(() => setPhase((p) => (p === "building" ? "ready" : p)), GENERATION_MS));
    return () => {
      for (const t of timers) window.clearTimeout(t);
    };
  }, [ready, reduced]);

  const skip = useCallback(() => setPhase("instant"), []);

  // 1–6 tuşları özellik açar; dünya kurulurken Esc/Boşluk geçişi atlar.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select")) return;
      if (phase === "building") {
        if (event.key === "Escape" || event.key === " ") {
          event.preventDefault();
          skip();
        }
        return;
      }
      if (open) return;
      const feature = features.find((f) => f.key === event.key);
      if (feature) setOpen(feature.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [features, open, phase, skip]);

  const openFeature = features.find((f) => f.id === open) ?? null;
  const hotFeature = features.find((f) => f.id === hot) ?? null;
  const building = phase === "building";

  return (
    <main className={styles.panel} data-phase={phase}>
      <div className={styles.sky} aria-hidden="true" />

      <header className={styles.top}>
        <Link href="/" className={styles.back}>
          <span aria-hidden="true">←</span> Odaya dön
        </Link>
        <h1 className={styles.title}>
          Anubix Dünyası
        </h1>
        <button type="button" className={styles.back} onClick={() => void logout()}>Çıkış yap</button>
      </header>

      <DueNotice />

      <div className={styles.stage}>
        <WorldMap phase={phase} labels={labels} hot={hot} onOpen={setOpen} onHot={setHot} />
      </div>

      <nav className={styles.hotbar} aria-label="Panel özellikleri" aria-hidden={building || undefined}>
        <ul>
          {features.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                className={styles.slot}
                data-hot={hot === f.id}
                tabIndex={building ? -1 : undefined}
                aria-label={`${f.title}: ${f.subtitle} (kısayol ${f.key})`}
                onClick={() => setOpen(f.id)}
                onPointerEnter={() => setHot(f.id)}
                onPointerLeave={() => setHot(null)}
                onFocus={() => setHot(f.id)}
                onBlur={() => setHot(null)}
              >
                <FeatureIcon id={f.id} />
                <kbd>{f.key}</kbd>
              </button>
            </li>
          ))}
        </ul>
        <p className={styles.hint}>
          {hotFeature
            ? `${hotFeature.title} · ${hotFeature.subtitle}`
            : `Bir yapıya tıkla ya da 1–${features.length} tuşlarını kullan`}
        </p>
      </nav>

      {building ? (
        <section className={styles.generating} aria-live="polite" aria-label="Dünya oluşturuluyor">
          <p className={styles.genText}>{STAGES[stage].text}</p>
          <div className={styles.bar} aria-hidden="true">
            <span style={{ animationDuration: `${GENERATION_MS}ms` }} />
          </div>
          <button type="button" className={styles.skip} onClick={skip}>
            Atla <kbd>Esc</kbd>
          </button>
        </section>
      ) : null}

      {openFeature ? <FeatureWindow feature={openFeature} onClose={() => setOpen(null)} /> : null}
    </main>
  );
}
